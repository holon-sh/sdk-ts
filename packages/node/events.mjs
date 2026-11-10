// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// It serves the poll and push delivery modes. Another delivery mode is a module of its own, given to createEvents,
// which reaches the event types through the internals below.
import { ProtocolError } from "@modelcontextprotocol/server";

/** The extension's identifier, under which a server declares it in capabilities.extensions. */
export const EVENTS_EXTENSION = "io.modelcontextprotocol/events";
const SUBSCRIPTION = "io.modelcontextprotocol/subscriptionId";
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
const FORBIDDEN = -32024;
const RESOURCE_EXHAUSTED = -32025;
const UNSUPPORTED = -32026;
/** Reaches what a delivery mode needs of the events it serves. Not for applications. */
export const INTERNALS = Symbol.for("holon-sh.events.internals");
// Requests are checked here, against each event type's own schema.
const params = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: value ?? {} }) } };

const refusal = ({ code, message, data }) => new ProtocolError(code, message, data);
const removed = { code: NOT_FOUND, message: "NotFound", data: { kind: "event" } };
const forbidden = { code: FORBIDDEN, message: "Forbidden" };
// What a client is told of a failure: its code when it is a JSON-RPC one, and its message.
const described = error => ({
  code: Number.isInteger(error?.code) ? error.code : INTERNAL_ERROR,
  message: error?.message || "InternalError",
  ...(error?.data !== undefined && { data: error.data }),
});
// Arguments are the same subscription whatever order their keys came in.
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  : value;
// Who asked, as Holon admitted them: the user, the client acting for them, and the agent when one acts for the user.
// A caller without credentials is nobody in particular.
const caller = context => {
  const { authInfo } = context ?? {};
  if (!authInfo) return null;
  const { iss = null, sub = null, act = null } = authInfo.extra ?? {};
  return JSON.stringify(canonical([iss, sub, authInfo.clientId ?? null, act]));
};
// A subscription's id is the same for the same caller, event type and arguments, so it survives reconnects and poll
// leases, as a webhook subscription's does. It is made with the global crypto, which needs no node:crypto at load.
const identify = async (who, name, args) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([who, name, canonical(args)])));
  return `sub_${[...new Uint8Array(digest, 0, 16)].map(byte => byte.toString(16).padStart(2, "0")).join("")}`;
};
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = run => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value, minimum) => value === undefined || Number.isInteger(value) && value >= minimum;

/**
 * Event types a process emits and the MCP servers it creates serve. Each type keeps what it emits, as `keep` bounds
 * it, for polls and for streams that reconnect. A type is asked again, and a poll told to come back, every `interval`
 * milliseconds unless the type says otherwise. A stream hears from the server every `heartbeat` milliseconds.
 */
export function createEvents({
  keep: { events: keptEvents = 10_000, age: keptAge = 10 * 60_000 } = {}, interval = 1000, heartbeat = 30_000,
  pollLease, maxSubscriptions = 10_000, maxSubscriptionsPerCaller = 1000, pageSize = 100, listChanged = false, modes = [],
} = {}) {
  const offered = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map();
  // Servers to tell when the event types change. Some are closed without having been connected, and never say so,
  // so they are held weakly.
  const served = new Set();
  const forgotten = new FinalizationRegistry(held => served.delete(held));
  let declared = 0;
  let subscribed = 0;
  const callers = new Map();

  const position = (type, sequence = type.sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor from the events emitted: the ones for it, in order, where delivery
  // starts, and where it now stands. A null cursor starts from now, and so does one from another process. One past
  // the events still kept starts from the oldest kept, and says that events were skipped.
  const since = (type, subscription, cursor, maxAgeMs, limit = Infinity) => {
    const now = { events: [], start: position(type), cursor: position(type), hasMore: false };
    if (cursor == null) return { ...now, truncated: false };
    const [process, text] = cursor.split(".");
    const sequence = Number(text);
    if (process !== epoch || !Number.isInteger(sequence) || sequence > type.sequence) return { ...now, truncated: true };
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence);
    const recent = later.filter(kept => kept.at >= floor);
    const truncated = sequence < type.dropped || recent.length < later.length;
    const events = [];
    let reached = recent.length ? recent[0].sequence - 1 : type.sequence;
    const start = position(type, reached);
    for (const kept of recent) {
      if (events.length === limit) return { events, start, cursor: position(type, reached), truncated, hasMore: true };
      reached = kept.sequence;
      const event = shape(type, kept, subscription);
      if (event) events.push(event);
    }
    return { events, start, cursor: position(type), truncated, hasMore: false };
  };

  // What a subscription is owed after a cursor from the type's check function. The cursor is the author's own. Each
  // event is placed at its own cursor when it has one, so a batch can be cut short; otherwise at the cursor before
  // the batch, which is safe to resume from. After a gap, delivery starts from the position the check reached.
  const checked = async (type, { arguments: args, context }, cursor, maxAgeMs, limit = Infinity) => {
    const result = await type.check(cursor ?? null, args, context);
    const next = result?.cursor ?? null;
    // A null cursor asks for the current position and nothing before it, except of a source that has no positions:
    // each check of that is asked with null, and answers with what is new.
    if (cursor == null && next !== null) return { events: [], start: next, cursor: next, truncated: false, hasMore: false };
    const items = result?.events ?? [];
    const floor = maxAgeMs === undefined || cursor == null ? -Infinity : Date.now() - maxAgeMs;
    let truncated = next !== null && Boolean(result.truncated);
    const events = [];
    let reached = cursor ?? null;
    let cuttable = false;
    const answer = (end, hasMore) => ({ events, start: truncated || !events.length ? end : cursor, cursor: end, truncated, hasMore });
    for (const [index, item] of items.entries()) {
      if (events.length === limit && cuttable) return answer(reached, true);
      const after = index === items.length - 1 ? next : item.cursor ?? reached;
      const { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), data, _meta } = item;
      if (Date.parse(timestamp) < floor) truncated = next !== null;
      else events.push({ eventId, name: type.name, timestamp, data, ...(_meta && { _meta }), cursor: after });
      reached = after;
      cuttable = item.cursor != null;
    }
    return answer(next, Boolean(result.hasMore));
  };

  // What a subscription is owed after a cursor, whichever way its type learns of events.
  const read = (type, subscription, cursor, { maxAgeMs, maxEvents } = {}) =>
    type.check ? checked(type, subscription, cursor, maxAgeMs, maxEvents) : since(type, subscription, cursor, maxAgeMs, maxEvents);

  // The occurrence a subscription receives, or nothing when it is not for it. An event emitted to one subscription
  // is for that one alone, and its arguments are not asked.
  const shape = (type, { sequence, target, occurrence }, { id, arguments: args, context }) => {
    if (target !== undefined ? target !== id : type.match && !type.match(occurrence.data, args, context)) return undefined;
    const data = type.transform ? type.transform(occurrence.data, args, context) : occurrence.data;
    return { ...occurrence, data, ...(sequence !== undefined && { cursor: position(type, sequence) }) };
  };

  // The event type and arguments a request names, checked as the sketch's errors require, in its order: the type,
  // the delivery mode, the request's own fields, the arguments, and then whether the caller may subscribe. A caller
  // refused loses what it holds of that subscription at once.
  const subscription = async ({ name, arguments: args = {}, cursor, maxAgeMs, maxEvents }, context, delivery) => {
    const type = types.get(name);
    if (!type) throw refusal(removed);
    if (delivery && !type.delivery.includes(delivery)) throw refusal({ code: UNSUPPORTED, message: "Unsupported", data: { feature: "deliveryMode", value: delivery } });
    if (cursor != null && typeof cursor !== "string") throw new ProtocolError(INVALID_PARAMS, "cursor must be a string or null");
    if (!integer(maxAgeMs, 0)) throw new ProtocolError(INVALID_PARAMS, "maxAgeMs must be a non-negative integer");
    if (!integer(maxEvents, 1)) throw new ProtocolError(INVALID_PARAMS, "maxEvents must be a positive integer");
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
    const id = await identify(caller(context), name, checked.value);
    if (type.authorize && !(await type.authorize(checked.value, context))) {
      endSubscription(type, id, forbidden);
      // This refusal is the answer the poll lease would have given, so the next poll begins afresh.
      leases.delete(id);
      throw refusal(forbidden);
    }
    return { type, subscription: { id, arguments: checked.value, context } };
  };

  const endSubscription = (type, id, error) => {
    for (const held of [...type.subscriptions.get(id)?.held ?? []]) held.end(error);
  };

  // Begins holding a subscription, by a stream, a poll lease or another delivery mode: counted against the limits
  // first, so a refused one provisions nothing. The type's onSubscribe is called when the first hold of an id
  // begins, and its teardown when the last ends, so two streams of one subscription set it up once. `end` is how the
  // delivery mode is told the app ended it; `close` is how the mode says its hold is over.
  const open = async (type, { id, delivery, arguments: args, context }, end) => {
    if (types.get(type.name) !== type) throw refusal(removed);
    const who = caller(context);
    if (subscribed >= maxSubscriptions) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: maxSubscriptions } });
    // Callers without credentials cannot be told apart, so only the limit on everyone holds them.
    if (who !== null && (callers.get(who) ?? 0) >= maxSubscriptionsPerCaller) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptionsPerCaller", max: maxSubscriptionsPerCaller } });
    subscribed++;
    if (who !== null) callers.set(who, (callers.get(who) ?? 0) + 1);
    let entry = type.subscriptions.get(id);
    if (!entry) {
      entry = { held: new Set() };
      type.subscriptions.set(id, entry);
      entry.ready = Promise.resolve().then(() => type.onSubscribe?.({ id, name: type.name, delivery, arguments: args, context }));
      entry.ready.catch(() => {});
    }
    let closed = false;
    const held = { id, name: type.name, delivery, arguments: args, context, end, close() {
      if (closed) return;
      closed = true;
      subscribed--;
      if (who !== null) callers.get(who) === 1 ? callers.delete(who) : callers.set(who, callers.get(who) - 1);
      entry.held.delete(held);
      if (entry.held.size) return;
      if (type.subscriptions.get(id) === entry) type.subscriptions.delete(id);
      entry.ready.then(teardown => { if (typeof teardown === "function") settle(teardown); }, () => {});
    } };
    entry.held.add(held);
    try {
      await entry.ready;
    } catch (error) {
      held.close();
      throw error;
    }
    // The type was removed while the subscription was being set up.
    if (types.get(type.name) !== type) {
      held.close();
      throw refusal(removed);
    }
    return held;
  };

  // Poll subscriptions are leased: the first poll of a subscription begins one, each poll renews it, and it ends
  // when polls stop for `pollLease`, a few of the intervals the poll was told to wait unless given.
  const leases = new Map();
  const lease = async (type, subscribed) => {
    let lent = leases.get(subscribed.id);
    if (lent && (lent.ended || lent.type !== type)) {
      leases.delete(subscribed.id);
      clearTimeout(lent.timer);
      lent.release?.();
      // The poll after one the app ended is answered with why, and the one after it begins afresh.
      if (lent.ended && lent.type === type) throw refusal(lent.ended);
      lent = undefined;
    }
    if (!lent) {
      lent = { type };
      leases.set(subscribed.id, lent);
      lent.opening = open(type, { ...subscribed, delivery: "poll" }, error => {
        lent.ended = error;
        lent.release?.();
      });
      lent.opening.then(held => {
        lent.release = () => held.close();
        if (lent.ended) held.close();
      }, () => { if (leases.get(subscribed.id) === lent) leases.delete(subscribed.id); });
    }
    const held = await lent.opening;
    // Ended while it was being set up.
    if (lent.ended) {
      leases.delete(subscribed.id);
      throw refusal(lent.ended);
    }
    clearTimeout(lent.timer);
    lent.timer = setTimeout(() => {
      if (leases.get(subscribed.id) === lent) leases.delete(subscribed.id);
      held.close();
    }, pollLease ?? Math.max(60_000, 3 * type.interval));
    lent.timer.unref?.();
    return held;
  };

  const changed = () => {
    if (!listChanged) return;
    for (const reference of served) {
      const server = reference.deref();
      if (!server) served.delete(reference);
      else if (server.transport) server.notification({ method: "notifications/events/list_changed" }).catch(() => {});
    }
  };

  // What a delivery mode works with: `subscription` checks a request, names its event type and the subscription's
  // id, `open` begins holding a subscription, `read` gives a subscription what it is owed after a cursor (`since` and
  // `shape` for emitted events alone), `position` is a type's cursor, a type's `sinks` hear what is emitted, and its
  // `subscriptions` are the ones held by every mode, by id.
  const internals = { types, subscription, open, read, since, shape, position };

  return {
    [INTERNALS]: internals,
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each. `check` returns what happened after a
     * cursor, for event types whose source keeps its own history.
     */
    event(name, { description, inputSchema, payloadSchema, _meta, match, transform, check, interval: every = interval, delivery = offered, authorize, onSubscribe }) {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own.
      const type = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, match, transform, check, interval: every, delivery, authorize, onSubscribe,
        sequence: 0, dropped: 0, kept: [], sinks: new Set(), subscriptions: new Map(),
      };
      types.set(name, type);
      changed();
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscription: target } = {}) {
          const occurrence = { eventId, name, timestamp, data };
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            for (const sink of type.sinks) sink({ target, occurrence });
            return;
          }
          // An event for one subscription is kept like any other, so the subscription has it when it comes back.
          const kept = { sequence: ++type.sequence, at: Date.now(), target, occurrence };
          type.kept.push(kept);
          while (type.kept.length > keptEvents || type.kept[0].at < kept.at - keptAge) type.dropped = type.kept.shift().sequence;
          for (const sink of type.sinks) sink(kept);
        },
        cursor() {
          if (type.check) throw new Error(`Event ${name} has a check function, whose cursor is its source's own.`);
          return position(type);
        },
        end(id, error = forbidden) {
          if (id !== undefined) return endSubscription(type, id, error);
          for (const each of [...type.subscriptions.keys()]) endSubscription(type, each, error);
        },
        remove() {
          if (types.get(name) !== type) return;
          types.delete(name);
          for (const each of [...type.subscriptions.keys()]) endSubscription(type, each, removed);
          changed();
        },
      };
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      const server = mcp.server ?? mcp;
      server.registerCapabilities({ extensions: { [EVENTS_EXTENSION]: { listChanged } } });
      if (listChanged) {
        const reference = new WeakRef(server);
        served.add(reference);
        forgotten.register(server, reference);
        const previous = server.onclose;
        server.onclose = () => {
          served.delete(reference);
          previous?.();
        };
      }
      const json = schema => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
      server.setRequestHandler("events/list", { params }, request => {
        const all = [...types.values()];
        let start = 0;
        if (request.cursor != null) {
          const after = Number(request.cursor);
          if (typeof request.cursor !== "string" || !Number.isInteger(after)) throw new ProtocolError(INVALID_PARAMS, "Invalid cursor for events/list");
          start = all.findIndex(type => type.order > after);
          if (start < 0) start = all.length;
        }
        const page = all.slice(start, start + pageSize);
        return {
          events: page.map(type => ({
            name: type.name,
            ...(type.description && { description: type.description }),
            delivery: type.delivery,
            inputSchema: json(type.inputSchema),
            payloadSchema: json(type.payloadSchema),
            ...(type._meta && { _meta: type._meta }),
          })),
          ...(start + pageSize < all.length && { nextCursor: String(page.at(-1).order) }),
        };
      });
      for (const mode of modes) mode.serve(server, internals);

      server.setRequestHandler("events/poll", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "poll");
        const held = await lease(type, subscribed);
        const { events, start, ...rest } = await read(type, held, request.cursor, request);
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, nextPollMs: type.interval };
      });

      server.setRequestHandler("events/stream", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "push");
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION]: ctx.mcpReq.id };
        let done = false;
        let ending;
        let wake = () => {};
        const finish = () => {
          done = true;
          wake();
        };
        const held = await open(type, { ...subscribed, delivery: "push" }, error => {
          ending = error;
          finish();
        });
        // A client that left while the subscription was being set up is not waited for.
        if (signal.aborted) {
          held.close();
          return { _meta: {} };
        }
        signal.addEventListener("abort", finish, { once: true });
        // A stream that cannot be written to is over.
        const notify = async (method, body) => {
          if (signal.aborted) return;
          try {
            await ctx.mcpReq.notify({ method: `notifications/events/${method}`, params: { ...body, _meta: meta } });
          } catch {
            finish();
          }
        };
        // The stream follows its cursor: emitted events wake it, and a type with a check function is asked again
        // every interval. What it is owed waits in the buffer or the source, not here, so a slow client is not owed
        // more memory than one batch; when what it is owed is no longer kept, it is told of the gap.
        let cursor = request.cursor ?? null;
        let behind = true;
        // What a type with a check function emitted and the stream has yet to send. The check function finds it
        // too, so when too much waits the oldest is let go.
        const pushed = [];
        const sink = kept => {
          if (type.check) {
            pushed.push(kept);
            if (pushed.length > keptEvents) pushed.shift();
          } else behind = true;
          wake();
        };
        type.sinks.add(sink);
        let beat;
        let beating = false;
        const heartbeats = () => setInterval(async () => {
          if (beating) return;
          beating = true;
          try {
            // Access is checked again while the subscription lasts, and one that is lost ends it.
            if (type.authorize && !(await type.authorize(subscribed.arguments, subscribed.context))) return endSubscription(type, held.id, forbidden);
            await notify("heartbeat", { cursor });
          } catch (error) {
            await notify("error", { error: described(error) });
          } finally {
            beating = false;
          }
        }, heartbeat);
        try {
          let first = true;
          let due = 0;
          while (!done) {
            if (type.check ? Date.now() >= due : behind) {
              behind = false;
              let result;
              try {
                result = await read(type, held, cursor, { maxAgeMs: first ? request.maxAgeMs : undefined });
              } catch (error) {
                // Without a first answer there is no stream to tell, and the request fails.
                if (first) throw error;
                await notify("error", { error: described(error) });
              }
              due = Date.now() + type.interval;
              if (result) {
                // The stream is confirmed before anything else is said on it.
                if (first || result.truncated) await notify("active", { cursor: result.start, truncated: result.truncated });
                if (first) beat = heartbeats();
                first = false;
                for (const event of result.events) {
                  if (done) break;
                  await notify("event", event);
                  cursor = event.cursor;
                }
                if (done) break;
                cursor = result.cursor;
                if (result.hasMore) {
                  due = 0;
                  behind = true;
                }
              }
            }
            // What a type with a check function emits is sent at once, at the cursor the stream has reached.
            while (pushed.length && !done) {
              const event = shape(type, pushed.shift(), held);
              if (event) await notify("event", { ...event, cursor });
            }
            if (done) break;
            let timer;
            await new Promise(resolve => {
              wake = resolve;
              if (done || pushed.length || (!type.check && behind)) resolve();
              else if (type.check) timer = setTimeout(resolve, Math.max(0, due - Date.now()));
            });
            clearTimeout(timer);
            wake = () => {};
          }
          if (ending) await notify("terminated", { error: ending });
        } finally {
          clearInterval(beat);
          type.sinks.delete(sink);
          held.close();
        }
        // The final frame, sent when the server ends the stream; when the client did, nobody is listening.
        return { _meta: {} };
      });
    },
  };
}

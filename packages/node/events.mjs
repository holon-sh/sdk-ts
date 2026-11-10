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
// Who asked, as Holon admitted them: polls by one principal for the same arguments are one subscription.
const principal = context => {
  const { authInfo } = context ?? {};
  return authInfo ? [authInfo.extra?.iss ?? null, authInfo.extra?.sub ?? authInfo.clientId ?? null] : null;
};
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = run => { Promise.resolve().then(run).catch(() => {}); };

/**
 * Event types a process emits and the MCP servers it creates serve. An event stays in memory for `maxAge`
 * milliseconds, and each type keeps at most `maxEvents`, for polls and for streams that reconnect. A stream hears
 * from the server every `heartbeat` milliseconds, and a poll is told to come back after `nextPollMs`.
 */
export function createEvents({
  maxAge = 10 * 60_000, maxEvents = 10_000, heartbeat = 30_000, nextPollMs = 1000, pollLease = 60_000,
  maxSubscriptions = 10_000, pageSize = 100, listChanged = false, modes = [],
} = {}) {
  const offered = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map();
  // Servers whose connection outlives a request, told when the event types change.
  const served = new Set();
  let declared = 0;
  let subscribed = 0;

  const position = (type, sequence = type.sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor from the events emitted: the ones its arguments match, in order, where
  // delivery starts, and where it now stands. A null cursor starts from now, and so does one from another process.
  // One past the events still kept starts from the oldest kept, and says that events were skipped.
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
  // the batch, which is safe to resume from.
  const checked = async (type, { arguments: args, context }, cursor, maxAgeMs, limit = Infinity) => {
    const result = await type.check(cursor ?? null, args, context);
    const next = result?.cursor ?? null;
    if (cursor == null) return { events: [], start: next, cursor: next, truncated: false, hasMore: false };
    const items = result.events ?? [];
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    let truncated = Boolean(result.truncated);
    const events = [];
    let reached = cursor;
    let cuttable = false;
    for (const [index, item] of items.entries()) {
      if (events.length === limit && cuttable) return { events, start: cursor, cursor: reached, truncated, hasMore: true };
      const after = index === items.length - 1 ? next : item.cursor ?? reached;
      const { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), data, _meta } = item;
      if (Date.parse(timestamp) < floor) truncated = true;
      else events.push({ eventId, name: type.name, timestamp, data, ...(_meta && { _meta }), cursor: after });
      reached = after;
      cuttable = item.cursor != null;
    }
    // Without a cursor there is no position to have skipped past.
    return { events, start: events.length ? cursor : next, cursor: next, truncated: next !== null && truncated, hasMore: Boolean(result.hasMore) };
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
  // the delivery mode, the arguments, and then whether the caller may subscribe.
  const subscription = async ({ name, arguments: args = {} }, context, delivery) => {
    const type = types.get(name);
    if (!type) throw refusal({ code: NOT_FOUND, message: "NotFound", data: { kind: "event" } });
    if (delivery && !type.delivery.includes(delivery)) throw refusal({ code: UNSUPPORTED, message: "Unsupported", data: { feature: "deliveryMode", value: delivery } });
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
    if (type.authorize && !(await type.authorize(checked.value, context))) throw refusal({ code: FORBIDDEN, message: "Forbidden" });
    return { type, subscription: { arguments: checked.value, context } };
  };

  // Begins a subscription: counted against the limit first, so a refused one provisions nothing, then told to the
  // type's onSubscribe. `end` is how the delivery mode ends it when the app does; `close` is how the mode says it
  // ended. A mode may give the subscription its own id.
  const open = async (type, { id = crypto.randomUUID(), delivery, arguments: args, context }, end) => {
    if (subscribed >= maxSubscriptions) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: maxSubscriptions } });
    subscribed++;
    let teardown;
    let closed = false;
    const opened = { id, name: type.name, delivery, arguments: args, context, end, close() {
      if (closed) return;
      closed = true;
      subscribed--;
      type.subscriptions.delete(id);
      if (typeof teardown === "function") settle(teardown);
    } };
    type.subscriptions.set(id, opened);
    try {
      teardown = await type.onSubscribe?.({ id, name: type.name, delivery, arguments: args, context });
    } catch (error) {
      opened.close();
      throw error;
    }
    // Ended while it was being set up.
    if (closed && typeof teardown === "function") settle(teardown);
    return opened;
  };

  // Poll subscriptions are leased: the first poll for a principal and arguments begins one, each poll renews it, and
  // it ends when polls stop for longer than a few of the intervals the poll was told to wait.
  const leases = new Map();
  const lease = async (type, { arguments: args, context }) => {
    const key = JSON.stringify([type.name, principal(context), canonical(args)]);
    let held = leases.get(key);
    if (held?.ended) {
      leases.delete(key);
      clearTimeout(held.timer);
      throw refusal(held.ended);
    }
    if (!held) {
      held = {};
      leases.set(key, held);
      held.opening = open(type, { delivery: "poll", arguments: args, context }, error => {
        // The next poll is answered with the error, and the one after it begins afresh.
        held.ended = error;
        held.opening.then(opened => opened.close(), () => {});
      });
      held.opening.catch(() => leases.delete(key));
    }
    const opened = await held.opening;
    clearTimeout(held.timer);
    held.timer = setTimeout(() => {
      if (leases.get(key) === held) leases.delete(key);
      opened.close();
    }, Math.max(pollLease, 3 * type.interval));
    held.timer.unref?.();
    return opened;
  };

  const changed = () => {
    if (!listChanged) return;
    for (const server of served) {
      try {
        server.notification({ method: "notifications/events/list_changed" }).catch(() => served.delete(server));
      } catch {
        served.delete(server);
      }
    }
  };

  // What a delivery mode works with: `subscription` checks a request and names its event type, `open` begins a
  // subscription, `read` gives a subscription what it is owed after a cursor (`since` and `shape` for emitted events
  // alone), `position` is a type's cursor, a type's `sinks` hear what is emitted, and its `subscriptions` are the
  // ones open by every mode.
  const internals = { types, subscription, open, read, since, shape, position };

  return {
    [INTERNALS]: internals,
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each. `check` returns what happened after a
     * cursor, for event types whose source keeps its own history.
     */
    event(name, { description, inputSchema, payloadSchema, _meta, match, transform, check, interval = nextPollMs, delivery = offered, authorize, onSubscribe }) {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own.
      const type = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, match, transform, check, interval, delivery, authorize, onSubscribe,
        sequence: 0, dropped: 0, kept: [], sinks: new Set(), subscriptions: new Map(),
      };
      types.set(name, type);
      changed();
      const end = (id, error) => {
        const ending = id === undefined ? [...type.subscriptions.values()] : [type.subscriptions.get(id)].filter(Boolean);
        for (const opened of ending) opened.end(error);
      };
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscription: target } = {}) {
          const occurrence = { eventId, name, timestamp, data };
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            for (const sink of type.sinks) sink({ target, occurrence });
            return;
          }
          const kept = { sequence: ++type.sequence, at: Date.now(), target, occurrence };
          type.kept.push(kept);
          while (type.kept.length > maxEvents || type.kept[0].at < kept.at - maxAge) type.dropped = type.kept.shift().sequence;
          for (const sink of type.sinks) sink(kept);
        },
        end(id, error = { code: FORBIDDEN, message: "Forbidden" }) {
          end(id, error);
        },
        remove() {
          if (!listChanged) throw new Error(`Event ${name} cannot be removed unless createEvents is given listChanged: true.`);
          if (types.get(name) !== type) return;
          types.delete(name);
          end(undefined, { code: NOT_FOUND, message: "NotFound", data: { kind: "event" } });
          changed();
        },
      };
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      const server = mcp.server ?? mcp;
      server.registerCapabilities({ extensions: { [EVENTS_EXTENSION]: { listChanged } } });
      if (listChanged) {
        served.add(server);
        const previous = server.onclose;
        server.onclose = () => {
          served.delete(server);
          previous?.();
        };
      }
      const json = schema => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
      server.setRequestHandler("events/list", { params }, request => {
        const all = [...types.values()];
        let start = 0;
        if (request.cursor != null) {
          const after = Number(request.cursor);
          if (!Number.isInteger(after)) throw new ProtocolError(INVALID_PARAMS, "Invalid cursor for events/list");
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
        const { id } = await lease(type, subscribed);
        const { events, start, ...rest } = await read(type, { ...subscribed, id }, request.cursor, request);
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
        const opened = await open(type, { ...subscribed, delivery: "push" }, error => {
          ending = error;
          finish();
        });
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
        // every interval. What it is sent waits in the buffer or the source, not here, so a slow client is not
        // owed more memory than one batch; when what it is owed is no longer kept, it is told of the gap.
        let cursor = request.cursor ?? null;
        let behind = true;
        const pushed = [];
        const sink = kept => {
          if (type.check) pushed.push(kept);
          else behind = true;
          wake();
        };
        type.sinks.add(sink);
        signal.addEventListener("abort", finish, { once: true });
        let beating = false;
        const beat = setInterval(async () => {
          if (beating) return;
          beating = true;
          try {
            // Access is checked again while the subscription lasts, and one that is lost ends it.
            if (type.authorize && !(await type.authorize(subscribed.arguments, subscribed.context))) return opened.end({ code: FORBIDDEN, message: "Forbidden" });
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
                result = await read(type, opened, cursor, { maxAgeMs: first ? request.maxAgeMs : undefined });
              } catch (error) {
                // Without a first answer there is no stream to tell, and the request fails.
                if (first) throw error;
                await notify("error", { error: described(error) });
              }
              due = Date.now() + type.interval;
              if (result) {
                if (first || result.truncated) await notify("active", { cursor: result.start, truncated: result.truncated });
                first = false;
                for (const event of result.events) {
                  if (done) break;
                  await notify("event", event);
                  cursor = event.cursor;
                }
                if (done) break;
                cursor = result.cursor;
                if (result.hasMore) due = 0;
              }
            }
            // What a type with a check function emits is sent at once, at the cursor the stream has reached.
            while (pushed.length && !done) {
              const event = shape(type, pushed.shift(), opened);
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
          opened.close();
        }
        // The final frame, sent when the server ends the stream; when the client did, nobody is listening.
        return { _meta: {} };
      });
    },
  };
}

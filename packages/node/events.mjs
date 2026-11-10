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
// Who asked, as Holon admitted them: the user, the client acting for them, the agent when one acts for the user, and
// what the token allows. A caller without a subject has no identity: nobody can tell it from another such caller.
const caller = context => {
  const { authInfo } = context ?? {};
  const { iss = null, sub, act = null } = authInfo?.extra ?? {};
  if (typeof sub !== "string") return null;
  return JSON.stringify(canonical([iss, sub, authInfo.clientId ?? null, act, [...authInfo.scopes ?? []].sort()]));
};
const hex = bytes => [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
// A subscription's id is the same for the same caller, event type and arguments, so it survives reconnects and poll
// leases, as a webhook subscription's does. It is made with the global crypto, which needs no node:crypto at load.
const identify = async (who, name, args) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([who, name, canonical(args)])));
  return `sub_${hex(new Uint8Array(digest, 0, 16))}`;
};
// How many bytes a message takes as JSON, as the limits on what is kept and queued count them.
const encoder = new TextEncoder();
const bytes = value => encoder.encode(JSON.stringify(value)).byteLength;
// The MCP SDK queues a notification on an HTTP response without waiting for the reader, and does not say how much
// waits. Its per-request transport keeps the response's stream controller, whose desiredSize falls by one for each
// frame waiting. Over stdio the SDK waits for the pipe to drain instead, so nothing waits there.
const waiting = server => {
  const size = server.transport?._sse?.controller?.desiredSize;
  return typeof size === "number" ? Math.max(0, 1 - size) : 0;
};
// A caller without an identity gets an id of its own for each stream.
const unique = () => `sub_${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = run => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value, minimum) => value === undefined || Number.isInteger(value) && value >= minimum;

/**
 * Event types a process emits and the MCP servers it creates serve. Each type keeps what it emits, as `keep` bounds
 * it, for polls and for streams that reconnect. A type is asked again, and a poll told to come back, every `interval`
 * milliseconds unless the type says otherwise. A stream hears from the server every `heartbeat` milliseconds, and
 * waits on at most `maxQueued` notifications taking `maxQueuedBytes` for a reader that has not read them.
 */
export function createEvents({
  keep: { events: keptEvents = 10_000, age: keptAge = 10 * 60_000, bytes: keptBytes = 4 * 2 ** 20 } = {},
  maxQueued = 1000, maxQueuedBytes = 2 ** 20, interval = 1000, heartbeat = 30_000,
  pollLease, maxSubscriptions = 10_000, maxSubscriptionsPerCaller = 100, pageSize = 100, listChanged = false, modes = [],
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
    const failures = [];
    let reached = recent.length ? recent[0].sequence - 1 : type.sequence;
    const start = position(type, reached);
    for (const kept of recent) {
      if (events.length === limit) return { events, failures, start, cursor: position(type, reached), truncated, hasMore: true };
      reached = kept.sequence;
      const event = shape(type, kept, subscription, error => failures.push(error));
      if (event) events.push(event);
    }
    return { events, failures, start, cursor: position(type), truncated, hasMore: false };
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
    const failures = [];
    let reached = cursor ?? null;
    let cuttable = false;
    const answer = (end, hasMore) => ({ events, failures, start: truncated || !events.length ? end : cursor, cursor: end, truncated, hasMore });
    for (const [index, item] of items.entries()) {
      if (events.length === limit && cuttable) return answer(reached, true);
      const after = index === items.length - 1 ? next : item.cursor ?? reached;
      const { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), data, _meta } = item;
      if (Date.parse(timestamp) < floor) truncated = next !== null;
      else if (serialisable(type, eventId, { data, _meta }, error => failures.push(error))) events.push({ eventId, name: type.name, timestamp, data, ...(_meta && { _meta }), cursor: after });
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
  // An event that cannot be shaped for a subscription, because `match` or `transform` throws or what `transform`
  // returns cannot be sent as JSON, is skipped for that subscription alone, so its cursor moves past it. It is
  // logged, and `failed` hears of it so a stream can say so once.
  const shape = (type, { sequence, target, occurrence }, { id, untargetable, arguments: args, context }, failed) => {
    let data;
    try {
      if (target !== undefined ? untargetable || target !== id : type.match && !type.match(occurrence.data, args, context)) return undefined;
      data = type.transform ? type.transform(occurrence.data, args, context) : occurrence.data;
      if (type.transform) JSON.stringify(data);
    } catch (error) {
      skipped(type, occurrence.eventId, error, failed);
      return undefined;
    }
    return { ...occurrence, data, ...(sequence !== undefined && { cursor: position(type, sequence) }) };
  };
  const skipped = (type, eventId, error, failed) => {
    console.error(`holon-sh/events: event ${eventId} of ${type.name} was skipped for a subscription:`, error);
    failed?.({ code: INTERNAL_ERROR, message: `Event ${eventId} could not be delivered and was skipped`, data: { eventId, reason: String(error?.message ?? error) } });
  };
  // What a check function found is skipped in the same way when it cannot be sent as JSON.
  const serialisable = (type, eventId, value, failed) => {
    try {
      JSON.stringify(value);
      return true;
    } catch (error) {
      skipped(type, eventId, error, failed);
      return false;
    }
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
    const who = caller(context);
    // Polls share a lease per caller and arguments, and callers without an identity share one per arguments.
    const lease = await identify(who, name, checked.value);
    if (type.authorize && !(await type.authorize(checked.value, context))) {
      endSubscription(type, lease, forbidden);
      // This refusal is the answer the poll lease would have given, so the next poll begins afresh.
      leases.delete(lease);
      throw refusal(forbidden);
    }
    return { type, subscription: { id: who === null ? unique() : lease, lease, arguments: checked.value, context } };
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
    // Callers without an identity cannot be told apart, so they count together as one.
    const who = caller(context) ?? "anonymous";
    if (subscribed >= maxSubscriptions) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: maxSubscriptions } });
    if ((callers.get(who) ?? 0) >= maxSubscriptionsPerCaller) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptionsPerCaller", max: maxSubscriptionsPerCaller } });
    subscribed++;
    callers.set(who, (callers.get(who) ?? 0) + 1);
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
      callers.get(who) === 1 ? callers.delete(who) : callers.set(who, callers.get(who) - 1);
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
  const lease = async (type, { lease: key, ...subscribed }) => {
    // A lease shared by callers without an identity is nobody's in particular, so nothing is emitted to it alone.
    const shared = key !== subscribed.id;
    let lent = leases.get(key);
    if (lent && (lent.ended || lent.type !== type)) {
      leases.delete(key);
      clearTimeout(lent.timer);
      lent.release?.();
      // The poll after one the app ended is answered with why, and the one after it begins afresh.
      if (lent.ended && lent.type === type) throw refusal(lent.ended);
      lent = undefined;
    }
    if (!lent) {
      lent = { type };
      leases.set(key, lent);
      lent.opening = open(type, { ...subscribed, id: key, delivery: "poll" }, error => {
        lent.ended = error;
        lent.release?.();
      });
      lent.opening.then(held => {
        if (shared) held.untargetable = true;
        lent.release = () => held.close();
        if (lent.ended) held.close();
      }, () => { if (leases.get(key) === lent) leases.delete(key); });
    }
    const held = await lent.opening;
    // Ended while it was being set up.
    if (lent.ended) {
      leases.delete(key);
      throw refusal(lent.ended);
    }
    clearTimeout(lent.timer);
    lent.timer = setTimeout(() => {
      if (leases.get(key) === lent) leases.delete(key);
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
    event(name, { description, inputSchema, payloadSchema, _meta, match, transform, key, check, interval: every = interval, delivery = offered, authorize, onSubscribe }) {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own.
      const type = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, match, transform, check, interval: every, delivery, authorize, onSubscribe,
        sequence: 0, dropped: 0, kept: [], bytes: 0, latest: new Map(), sinks: new Set(), subscriptions: new Map(), owed: new Map(),
      };
      // Events kept, oldest first, each placed by its sequence.
      const find = sequence => {
        let low = 0;
        let high = type.kept.length;
        while (low < high) {
          const middle = (low + high) >> 1;
          if (type.kept[middle].sequence < sequence) low = middle + 1;
          else high = middle;
        }
        return low;
      };
      types.set(name, type);
      changed();
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscription: target } = {}) {
          const occurrence = { eventId, name, timestamp, data };
          // An event with a key replaces the one before it with the same key, for the same subscriptions.
          const replaces = key && JSON.stringify([target ?? null, key(data)]);
          const size = bytes(occurrence);
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            // An event for one subscription that has no stream to take it is lost, and the subscription is told of
            // a gap when it next polls or streams. The ids owed one are as many as the events a type keeps.
            if (target !== undefined && ![...type.subscriptions.get(target)?.held ?? []].some(held => held.delivery !== "poll")) {
              type.owed.delete(target);
              type.owed.set(target, true);
              if (type.owed.size > keptEvents) type.owed.delete(type.owed.keys().next().value);
            }
            for (const sink of type.sinks) sink({ target, occurrence, size, replaces });
            return;
          }
          // An event for one subscription is kept like any other, so the subscription has it when it comes back.
          const kept = { sequence: ++type.sequence, at: Date.now(), target, occurrence, size, replaces };
          if (replaces) {
            const older = type.latest.get(replaces);
            if (older) {
              type.kept.splice(find(older.sequence), 1);
              type.bytes -= older.size;
            }
            type.latest.set(replaces, kept);
          }
          type.kept.push(kept);
          type.bytes += size;
          // The newest is kept whatever it weighs, since streams read it from here.
          while (type.kept.length > 1 && (type.kept.length > keptEvents || type.bytes > keptBytes || type.kept[0].at < kept.at - keptAge)) {
            const oldest = type.kept.shift();
            type.dropped = oldest.sequence;
            type.bytes -= oldest.size;
            if (type.latest.get(oldest.replaces) === oldest) type.latest.delete(oldest.replaces);
          }
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
        // Each poll is answered for its own caller, with the lease's id.
        const { events, start, failures, truncated, ...rest } = await read(type, { ...subscribed, id: held.id, untargetable: held.untargetable }, request.cursor, request);
        const lost = !held.untargetable && type.owed.delete(held.id);
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, truncated: truncated || lost, nextPollMs: type.interval };
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
        // Ended while it was being set up: no stream is opened, and the request is refused.
        if (ending) {
          held.close();
          throw refusal(ending);
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
        // every interval. What it is owed waits in the buffer or the source, and is read a queue's worth at a time.
        // What it has sent but its reader has not read is bounded: past the bound, the stream stops sending, and once
        // the reader has caught up it is told of a gap and carries on from the newest.
        let cursor = request.cursor ?? null;
        let behind = true;
        let overflowed = false;
        // What a type with a check function emitted and the stream has yet to send. The check function finds it
        // too, so when too much waits the oldest is let go.
        const pushed = [];
        let pushedBytes = 0;
        // Some of it was let go, and the stream owes its reader word of the gap.
        let lost = false;
        const sink = kept => {
          if (type.check) {
            const older = kept.replaces ? pushed.findIndex(waiting => waiting.replaces === kept.replaces) : -1;
            if (older >= 0) pushedBytes -= pushed.splice(older, 1)[0].size;
            pushed.push(kept);
            pushedBytes += kept.size;
            while (pushed.length > 1 && (pushed.length > maxQueued || pushedBytes > maxQueuedBytes)) {
              pushedBytes -= pushed.shift().size;
              lost = true;
            }
          } else behind = true;
          wake();
        };
        // The sizes of the frames sent and not yet read, newest last.
        let unread = [];
        const room = size => {
          const count = waiting(server);
          unread = count ? unread.slice(-count) : [];
          // An event is sent alone when nothing waits, whatever it weighs.
          return count === 0 || count < maxQueued && unread.reduce((sum, each) => sum + each, size) <= maxQueuedBytes;
        };
        const send = async event => {
          const size = bytes(event);
          if (!room(size)) return !(overflowed = true);
          unread.push(size);
          await notify("event", event);
          cursor = event.cursor;
          return true;
        };
        type.sinks.add(sink);
        let beat;
        let beating = false;
        const heartbeats = () => setInterval(async () => {
          if (beating || overflowed) return;
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
            if (overflowed) {
              // Nothing more is sent until the reader has read what waits.
              while (!done && waiting(server)) await new Promise(resolve => setTimeout(resolve, 50));
              if (done) break;
              let head = cursor;
              try {
                // A source without positions has no newest to go on from: its next check answers with what is new.
                head = type.check ? cursor === null ? null : (await read(type, held, null)).cursor : position(type);
              } catch (error) {
                await notify("error", { error: described(error) });
              }
              cursor = head;
              pushed.length = 0;
              pushedBytes = 0;
              unread = [];
              overflowed = false;
              lost = false;
              behind = false;
              due = Date.now() + type.interval;
              // A source without positions has nothing to have skipped past, so it is not told of a gap.
              if (cursor !== null) await notify("active", { cursor, truncated: true });
            }
            if (type.check ? Date.now() >= due : behind) {
              behind = false;
              let result;
              try {
                result = await read(type, held, cursor, { maxAgeMs: first ? request.maxAgeMs : undefined, maxEvents: maxQueued });
              } catch (error) {
                // Without a first answer there is no stream to tell, and the request fails.
                if (first) throw error;
                await notify("error", { error: described(error) });
              }
              due = Date.now() + type.interval;
              if (result) {
                // A check function's gap is told after the events that follow it, at the position after them, since
                // the position before them is not known and the client's cursor must not go back. The stream is
                // confirmed before anything else is said on it.
                const after = type.check && result.truncated && !first;
                const truncated = result.truncated || first && type.owed.delete(held.id);
                if (first || truncated && !after) await notify("active", { cursor: type.check && result.truncated ? cursor : result.start, truncated });
                if (first) beat = heartbeats();
                first = false;
                for (const error of result.failures ?? []) await notify("error", { error });
                let sent = true;
                for (const event of result.events) if (done || !(sent = await send(event))) break;
                if (done) break;
                if (!sent) continue;
                cursor = result.cursor;
                if (after) await notify("active", { cursor, truncated: true });
                if (result.hasMore) {
                  due = 0;
                  behind = true;
                }
              }
            }
            // What a type with a check function emits is sent at once, at the cursor the stream has reached.
            if (lost && !overflowed) {
              lost = false;
              if (cursor !== null) await notify("active", { cursor, truncated: true });
            }
            while (pushed.length && !done && !overflowed) {
              const kept = pushed.shift();
              pushedBytes -= kept.size;
              let failure;
              const event = shape(type, kept, held, error => { failure = error; });
              if (failure) await notify("error", { error: failure });
              if (event && !(await send({ ...event, cursor }))) break;
            }
            if (done) break;
            if (overflowed) continue;
            let timer;
            await new Promise(resolve => {
              wake = resolve;
              if (done || pushed.length || (!type.check && behind)) resolve();
              else if (type.check) timer = setTimeout(resolve, Math.max(0, due - Date.now()));
            });
            clearTimeout(timer);
            wake = () => {};
          }
          if (ending) {
            if (first) throw refusal(ending);
            await notify("terminated", { error: ending });
          }
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

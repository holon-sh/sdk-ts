// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// It serves the poll and push delivery modes of emit-only event types. Another delivery mode is a module of its own,
// given to createEvents, which reaches the event types through the internals below.
import { ProtocolError } from "@modelcontextprotocol/server";

/** The extension's identifier, under which a server declares it in capabilities.extensions. */
export const EVENTS_EXTENSION = "io.modelcontextprotocol/events";
const SUBSCRIPTION = "io.modelcontextprotocol/subscriptionId";
const INVALID_PARAMS = -32602;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
/** Reaches what a delivery mode needs of the events it serves. Not for applications. */
export const INTERNALS = Symbol.for("holon-sh.events.internals");
// Requests are checked here, against each event type's own schema.
const params = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: value ?? {} }) } };

/**
 * Event types a process emits and the MCP servers it creates serve. An event stays in memory for `maxAge`
 * milliseconds, and each type keeps at most `maxEvents`, for polls and for streams that reconnect. A stream hears
 * from the server every `heartbeat` milliseconds, and a poll is told to come back after `nextPollMs`.
 */
export function createEvents({ maxAge = 10 * 60_000, maxEvents = 10_000, heartbeat = 30_000, nextPollMs = 1000, modes = [] } = {}) {
  const delivery = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map();

  const position = (type, sequence = type.sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor: the events its arguments match, in order, and where it now stands.
  // A null cursor starts from now. One that names another process, or events no longer kept, restarts from now too.
  const since = (type, subscription, cursor, maxAgeMs, limit = Infinity) => {
    const [process, text] = cursor?.split(".") ?? [];
    const sequence = Number(text);
    if (cursor == null) return { events: [], cursor: position(type), truncated: false, hasMore: false };
    if (process !== epoch || !Number.isInteger(sequence) || sequence < type.dropped || sequence > type.sequence)
      return { events: [], cursor: position(type), truncated: true, hasMore: false };
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence);
    const recent = later.filter(kept => kept.at >= floor);
    const events = [];
    let reached = recent.length ? recent[0].sequence - 1 : type.sequence;
    for (const kept of recent) {
      if (events.length === limit) return { events, cursor: position(type, reached), truncated: recent.length < later.length, hasMore: true };
      reached = kept.sequence;
      const event = shape(type, kept, subscription);
      if (event) events.push(event);
    }
    return { events, cursor: position(type), truncated: recent.length < later.length, hasMore: false };
  };

  // The occurrence a subscription receives, or nothing when its arguments do not match.
  const shape = (type, { sequence, occurrence }, { arguments: args, context }) => {
    if (type.match && !type.match(occurrence.data, args, context)) return undefined;
    const data = type.transform ? type.transform(occurrence.data, args, context) : occurrence.data;
    return { ...occurrence, data, cursor: position(type, sequence) };
  };

  // The event type and arguments a request names, checked as the sketch's errors require.
  const subscription = async ({ name, arguments: args = {} }, context) => {
    const type = types.get(name);
    if (!type) throw new ProtocolError(NOT_FOUND, "NotFound", { kind: "event" });
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
    return { type, subscription: { arguments: checked.value, context } };
  };

  // What a delivery mode works with: `subscription` checks a request and names its event type, `since` and `shape`
  // give a subscription its occurrences, `position` is a type's cursor, and a type's `sinks` hear what is emitted.
  const internals = { types, subscription, since, shape, position };

  return {
    [INTERNALS]: internals,
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each.
     */
    event(name, { description, inputSchema, payloadSchema, match, transform }) {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own.
      const type = { name, description, inputSchema, payloadSchema, match, transform, sequence: 0, dropped: 0, kept: [], sinks: new Set() };
      types.set(name, type);
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString() } = {}) {
          const kept = { sequence: ++type.sequence, at: Date.now(), occurrence: { eventId, name, timestamp, data } };
          type.kept.push(kept);
          while (type.kept.length > maxEvents || type.kept[0].at < kept.at - maxAge) type.dropped = type.kept.shift().sequence;
          for (const sink of type.sinks) sink(kept);
        },
      };
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      const server = mcp.server ?? mcp;
      server.registerCapabilities({ extensions: { [EVENTS_EXTENSION]: { listChanged: false } } });
      const json = schema => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
      server.setRequestHandler("events/list", { params }, () => ({
        events: [...types.values()].map(type => ({
          name: type.name,
          ...(type.description && { description: type.description }),
          delivery,
          inputSchema: json(type.inputSchema),
          payloadSchema: json(type.payloadSchema),
        })),
      }));
      for (const mode of modes) mode.serve(server, internals);
      server.setRequestHandler("events/poll", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http);
        const { events, ...rest } = since(type, subscribed, request.cursor, request.maxAgeMs, request.maxEvents);
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, nextPollMs };
      });
      server.setRequestHandler("events/stream", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http);
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION]: ctx.mcpReq.id };
        let closed;
        const open = new Promise(resolve => { closed = resolve; });
        // Notifications go out one after another, and a stream that cannot be written to is over.
        let sent = Promise.resolve();
        const notify = (method, body) => {
          sent = sent.then(() => signal.aborted || ctx.mcpReq.notify({ method: `notifications/events/${method}`, params: { ...body, _meta: meta } })).catch(closed);
        };
        // Events emitted while the missed ones are being sent wait their turn.
        const live = kept => { const event = shape(type, kept, subscribed); if (event) notify("event", event); };
        const missed = since(type, subscribed, request.cursor, request.maxAgeMs);
        notify("active", { cursor: missed.events.length ? request.cursor : missed.cursor, truncated: missed.truncated });
        for (const event of missed.events) notify("event", event);
        type.sinks.add(live);
        const beat = setInterval(() => notify("heartbeat", { cursor: position(type) }), heartbeat);
        signal.addEventListener("abort", closed, { once: true });
        await open;
        clearInterval(beat);
        type.sinks.delete(live);
        return { _meta: {} };
      });
    },
  };
}

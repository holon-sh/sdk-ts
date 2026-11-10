// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// The draft is experimental, so this lives under ext and may change with it. It serves the poll and push delivery
// modes of emit-only event types. Another delivery mode is a module of its own, given to createEvents, which reaches
// the event types through the internals below.
import { ProtocolError } from "@modelcontextprotocol/server";

/** A schema that validates a value and describes itself as JSON Schema, as Zod's schemas do. */
export interface EventSchema<T = unknown> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types?: { readonly input: unknown; readonly output: T };
    readonly validate: (value: unknown) => Checked<T> | Promise<Checked<T>>;
    readonly jsonSchema: { readonly input: (options: { target: "draft-2020-12" }) => object };
  };
}
/** What a schema says of a value: the value it accepts, or why it refuses it. */
export type Checked<T> = { readonly value: T; readonly issues?: undefined } | { readonly issues: ReadonlyArray<{ readonly message: string }> };
/** The request a subscription came in, as Holon admitted it: read its caller with getContext. */
export type SubscriptionContext = { authInfo?: { clientId: string; scopes: string[]; extra?: Record<string, unknown> } } | undefined;
/** An event type: the arguments a subscription gives, and the data each occurrence carries. */
export interface EventDefinition<A, D> {
  description?: string;
  /** The arguments of a subscription. A request whose arguments do not match is refused. */
  inputSchema: EventSchema<A>;
  /** The data of each occurrence, as subscriptions receive it. */
  payloadSchema: EventSchema;
  /** Whether a subscription with these arguments receives the event. Without it, every subscription does. */
  match?: (data: D, args: A, context: SubscriptionContext) => boolean;
  /** The data a subscription with these arguments receives. Without it, the data as emitted. */
  transform?: (data: D, args: A, context: SubscriptionContext) => unknown;
}
/** Emits occurrences of one event type to the subscriptions they match. */
export interface Emitter<D> {
  /** `eventId` lets a client drop an occurrence it has seen. Give the source's own id when it has one. */
  emit(data: D, options?: { eventId?: string; timestamp?: string }): void;
}
export interface EventsOptions {
  /** How long an event is kept for polls and reconnecting streams, in milliseconds. Ten minutes unless given. */
  maxAge?: number;
  /** How many events of one type are kept. Ten thousand unless given. */
  maxEvents?: number;
  /** How often a stream hears from the server when nothing happens, in milliseconds. Thirty seconds unless given. */
  heartbeat?: number;
  /** How long a poll is told to wait before the next, in milliseconds. One second unless given. */
  nextPollMs?: number;
  /** Delivery modes besides poll and push, each from a module of its own. */
  modes?: DeliveryMode[];
}
/** A delivery mode besides poll and push. It registers its requests on each server and is listed by events/list. */
export interface DeliveryMode {
  readonly name: string;
  serve(server: object, internals: Internals): void;
}
/** The event types of a process, served by each MCP server it creates. */
export interface Events {
  /** Declares an event type. Emit its occurrences with the returned emitter. */
  event<A, D>(name: string, definition: EventDefinition<A, D>): Emitter<D>;
  /** Serves events/list, events/poll and events/stream on an McpServer or a Server, and declares the extension. */
  serve(server: object): void;
  /** What a delivery mode works with. Not for applications. */
  readonly [INTERNALS]: Internals;
}

/** An occurrence as subscriptions receive it, at the cursor after it. */
export interface Occurrence { eventId: string; name: string; timestamp: string; data: unknown; cursor?: string }
/** An emitted event, kept at its sequence. */
export interface Kept { sequence: number; at: number; occurrence: Occurrence }
/** A subscription: its checked arguments and the request it came in. */
export interface Subscribed { arguments: unknown; context: SubscriptionContext }
/** What a subscription is owed after a cursor. */
export interface Owed { events: Occurrence[]; cursor: string; truncated: boolean; hasMore: boolean }
/** A declared event type, as the delivery modes see it. */
export interface EventTypeState {
  readonly name: string;
  /** Told each event as it is emitted: a push stream is one, and a delivery mode adds its own. */
  readonly sinks: Set<(kept: Kept) => void>;
}
/** What a delivery mode works with. */
export interface Internals {
  readonly types: Map<string, EventTypeState>;
  /** Checks a request and names its event type. */
  readonly subscription: (request: Record<string, unknown>, context: SubscriptionContext) => Promise<{ type: EventTypeState; subscription: Subscribed }>;
  /** What a subscription is owed after a cursor. */
  readonly since: (type: EventTypeState, subscription: Subscribed, cursor: string | null | undefined, maxAgeMs?: number, limit?: number) => Owed;
  /** An emitted event as one subscription receives it, or nothing when its arguments do not match. */
  readonly shape: (type: EventTypeState, kept: Kept, subscription: Subscribed) => Occurrence | undefined;
  /** A type's current cursor. */
  readonly position: (type: EventTypeState, sequence?: number) => string;
}

/** The identifier a server declares the Events extension under, in capabilities.extensions. */
export const EVENTS_EXTENSION = "io.modelcontextprotocol/events";
/** Reaches what a delivery mode needs of the events it serves. Not for applications. */
export const INTERNALS: unique symbol = Symbol.for("holon-sh.events.internals");

// The parts of an MCP server and of a request's context this module uses.
interface Served {
  registerCapabilities(capabilities: object): void;
  setRequestHandler(method: string, schemas: object, handler: (request: any, ctx: Context) => unknown): void;
}
interface Context {
  mcpReq: { id: string | number; signal: AbortSignal; notify(notification: { method: string; params: object }): Promise<void> };
  http?: SubscriptionContext & object;
}
interface Type extends EventTypeState {
  readonly description?: string | undefined;
  readonly inputSchema: EventSchema<any>;
  readonly payloadSchema: EventSchema;
  readonly match?: EventDefinition<any, any>["match"];
  readonly transform?: EventDefinition<any, any>["transform"];
  sequence: number;
  dropped: number;
  kept: Kept[];
}

const SUBSCRIPTION = "io.modelcontextprotocol/subscriptionId";
const INVALID_PARAMS = -32602;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
// Requests are checked here, against each event type's own schema.
const params = { "~standard": { version: 1, vendor: "holon-sh", validate: (value: unknown) => ({ value: value ?? {} }) } };

/**
 * Event types a process emits and the MCP servers it creates serve, in the poll and push delivery modes of MCP Events,
 * the draft extension of the Triggers & Events Working Group. An event stays in memory for `maxAge` milliseconds, and
 * each type keeps at most `maxEvents`, for polls and for streams that reconnect, so a cursor lasts as long as the
 * process: after a restart a client is told that events were skipped. A stream hears from the server every
 * `heartbeat` milliseconds, and a poll is told to come back after `nextPollMs`.
 */
export function createEvents({ maxAge = 10 * 60_000, maxEvents = 10_000, heartbeat = 30_000, nextPollMs = 1000, modes = [] }: EventsOptions = {}): Events {
  const delivery = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map<string, Type>();

  const position = (type: EventTypeState, sequence: number = (type as Type).sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor: the events its arguments match, in order, and where it now stands.
  // A null cursor starts from now. One that names another process, or events no longer kept, restarts from now too.
  const since: Internals["since"] = (state, subscription, cursor, maxAgeMs, limit = Infinity) => {
    const type = state as Type;
    const [process, text] = cursor?.split(".") ?? [];
    const sequence = Number(text);
    if (cursor == null) return { events: [], cursor: position(type), truncated: false, hasMore: false };
    if (process !== epoch || !Number.isInteger(sequence) || sequence < type.dropped || sequence > type.sequence)
      return { events: [], cursor: position(type), truncated: true, hasMore: false };
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence);
    const recent = later.filter(kept => kept.at >= floor);
    const events: Occurrence[] = [];
    let reached = recent.length ? recent[0]!.sequence - 1 : type.sequence;
    for (const kept of recent) {
      if (events.length === limit) return { events, cursor: position(type, reached), truncated: recent.length < later.length, hasMore: true };
      reached = kept.sequence;
      const event = shape(type, kept, subscription);
      if (event) events.push(event);
    }
    return { events, cursor: position(type), truncated: recent.length < later.length, hasMore: false };
  };

  // The occurrence a subscription receives, or nothing when its arguments do not match.
  const shape: Internals["shape"] = (state, { sequence, occurrence }, { arguments: args, context }) => {
    const type = state as Type;
    if (type.match && !type.match(occurrence.data, args, context)) return undefined;
    const data = type.transform ? type.transform(occurrence.data, args, context) : occurrence.data;
    return { ...occurrence, data, cursor: position(type, sequence) };
  };

  // The event type and arguments a request names, checked as the sketch's errors require.
  const subscription: Internals["subscription"] = async ({ name, arguments: args = {} }, context) => {
    const type = types.get(name as string);
    if (!type) throw new ProtocolError(NOT_FOUND, "NotFound", { kind: "event" });
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
    return { type, subscription: { arguments: checked.value, context } };
  };

  // What a delivery mode works with: `subscription` checks a request and names its event type, `since` and `shape`
  // give a subscription its occurrences, `position` is a type's cursor, and a type's `sinks` hear what is emitted.
  const internals: Internals = { types, subscription, since, shape, position };

  return {
    [INTERNALS]: internals,
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each.
     */
    event<A, D>(name: string, { description, inputSchema, payloadSchema, match, transform }: EventDefinition<A, D>): Emitter<D> {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own.
      const type: Type = { name, description, inputSchema, payloadSchema, match: match as Type["match"], transform: transform as Type["transform"], sequence: 0, dropped: 0, kept: [], sinks: new Set() };
      types.set(name, type);
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString() } = {}) {
          const kept = { sequence: ++type.sequence, at: Date.now(), occurrence: { eventId, name, timestamp, data } };
          type.kept.push(kept);
          while (type.kept.length > maxEvents || type.kept[0]!.at < kept.at - maxAge) type.dropped = type.kept.shift()!.sequence;
          for (const sink of type.sinks) sink(kept);
        },
      };
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      const server: Served = (mcp as { server?: Served }).server ?? mcp as Served;
      server.registerCapabilities({ extensions: { [EVENTS_EXTENSION]: { listChanged: false } } });
      const json = (schema: EventSchema) => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
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
        let closed = () => {};
        const open = new Promise<void>(resolve => { closed = resolve; });
        // Notifications go out one after another, and a stream that cannot be written to is over.
        let sent: Promise<unknown> = Promise.resolve();
        const notify = (method: string, body: object) => {
          sent = sent.then(() => signal.aborted ? undefined : ctx.mcpReq.notify({ method: `notifications/events/${method}`, params: { ...body, _meta: meta } })).catch(closed);
        };
        // Events emitted while the missed ones are being sent wait their turn.
        const live = (kept: Kept) => { const event = shape(type, kept, subscribed); if (event) notify("event", event); };
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

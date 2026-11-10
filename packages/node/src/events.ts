// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// It serves the poll and push delivery modes. Another delivery mode is a module of its own, given to createEvents,
// which reaches the event types through the internals below.
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
/** How a subscription receives its events. */
export type DeliveryModeName = "poll" | "push" | (string & {});
/** A JSON-RPC error, as a subscription that ends or fails is told it. */
export interface EventError { code: number; message: string; data?: unknown }
/** A subscription as it begins: who asked, for what, and by which delivery mode. */
export interface Subscription<A> {
  /**
   * Names the subscription to `emit` and `end`. For a caller with an identity it is the same for the same caller,
   * event type and arguments, so it survives a reconnect and a poll lease that lapses. The caller is the user, the
   * client acting for them, the agent acting for the user and the token's scopes, as Holon admitted them; two streams
   * with the same id both receive what is emitted to it. A caller without a subject has no identity: each of its
   * streams has an id of its own, which ends with the stream, and its polls share one lease per arguments with every
   * such caller, to which nothing is emitted alone.
   */
  readonly id: string;
  readonly name: string;
  readonly delivery: DeliveryModeName;
  readonly arguments: A;
  readonly context: SubscriptionContext;
}
/** An event a check function found. */
export interface CheckedEvent<D> {
  data: D;
  /** The source's own id, so that a client drops an event it has seen. Made up when not given. */
  eventId?: string;
  /** When it happened, in ISO 8601. Now when not given. */
  timestamp?: string;
  /** The position just after this event, so that a batch can be cut short. Without it, a batch is delivered whole. */
  cursor?: string;
  _meta?: Record<string, unknown>;
}
/** What happened after a cursor, as a check function finds it. */
export interface CheckResult<D> {
  /**
   * Empty when the cursor was null: a null cursor asks only for the current position. A source without positions
   * answers with a null cursor, is asked with null each time, and answers each time with what is new.
   */
  events: CheckedEvent<D>[];
  /** The position after these events, or null when the source cannot be resumed from a position. */
  cursor: string | null;
  /** Events between the cursor and these were skipped, for instance because the source no longer keeps them. */
  truncated?: boolean;
  /** More events are ready at once after this batch. */
  hasMore?: boolean;
}
/** An event type: the arguments a subscription gives, and the data each occurrence carries. */
export interface EventDefinition<A, D> {
  description?: string;
  /** The arguments of a subscription. A request whose arguments do not match is refused. */
  inputSchema: EventSchema<A>;
  /** The data of each occurrence, as subscriptions receive it. */
  payloadSchema: EventSchema;
  /** Listed with the event type, as `_meta` is on a tool. */
  _meta?: Record<string, unknown>;
  /**
   * Whether a subscription with these arguments receives an emitted event. Without it, every subscription does. When
   * it or `transform` throws, or `transform` returns what cannot be sent as JSON, that event is skipped for that
   * subscription: its cursor moves past it, a stream is told once with `notifications/events/error`, and the failure
   * is logged.
   */
  match?: (data: D, args: A, context: SubscriptionContext) => boolean;
  /** The data a subscription with these arguments receives of an emitted event. Without it, the data as emitted. */
  transform?: (data: D, args: A, context: SubscriptionContext) => unknown;
  /**
   * For events that each hold the whole of a record: an emitted event replaces the one before it with the same key,
   * among the events kept and the ones a stream has yet to send. A subscription is given the latest occurrence of
   * each key, in the order of those latest emits, and is not told of a gap, since nothing it would act on was lost.
   * Groups are not kept whole: a reader that is behind may get a later occurrence of one key without the group the
   * earlier one came in. `match` must answer the same for every occurrence of a key, or a subscriber may never hear
   * of a record whose newest occurrence it does not match. Do not give a key to events that each say what changed: a
   * client behind would miss a change.
   */
  key?: (data: D) => string;
  /**
   * What happened after a cursor, for a source that keeps its own history: polls are answered by it, and streams ask
   * it every `interval`. The cursor is the source's own, so it outlives the process. A null cursor asks for the
   * current position. The function filters and shapes for the arguments itself; `match` and `transform` apply only to
   * what is emitted. Without it, emitted events are kept in memory and polls and streams are served from there.
   */
  check?: (cursor: string | null, args: A, context: SubscriptionContext) => CheckResult<D> | Promise<CheckResult<D>>;
  /** How long a poll is told to wait, and how often a stream asks the check function, in milliseconds. The `interval` given to createEvents unless given. */
  interval?: number;
  /** The delivery modes this event type offers. Every mode served unless given. */
  delivery?: DeliveryModeName[];
  /**
   * Whether the caller may subscribe with these arguments. A subscription is refused with Forbidden when it may not,
   * and one already open is ended when it no longer may: each poll asks, and a stream asks at each heartbeat. A
   * refused poll ends its lease at once.
   */
  authorize?: (args: A, context: SubscriptionContext) => boolean | Promise<boolean>;
  /**
   * Called when a subscription begins, to set up what its events come from. What it returns is called when the
   * subscription ends: its last push stream closes, its poll lease lapses because polls stopped, or the app ends it.
   * A subscription held by two streams at once is set up once. A server that restarts calls it again on the next
   * poll or stream, with the same id.
   */
  onSubscribe?: (subscription: Subscription<A>) => void | (() => unknown) | Promise<void | (() => unknown)>;
}
/** Emits occurrences of one event type to the subscriptions they match, and ends its subscriptions. */
export interface Emitter<D> {
  /**
   * `eventId` lets a client drop an occurrence it has seen. Give the source's own id when it has one. With
   * `subscription`, the occurrence goes to that subscription alone, whatever its arguments; it is kept like any
   * other, so a subscription that reconnects or polls again from its cursor still has it, or is told of a gap. An
   * event type with a check function pushes what it emits to open streams at once and does not keep it: polls and
   * reconnecting streams learn of it from the check function, and one emitted to a subscription that does not get it
   * on a stream is lost, so that subscription's next poll or stream is told of a gap.
   *
   * Emitting is synchronous. Occurrences emitted one after another in the same synchronous run reach each
   * subscription in that order, with no other occurrence of this type between them, whether polled or pushed. So a
   * group of changes that nothing may come between is either emitted in one run or sent as one occurrence holding a
   * list. A subscription skips part of a group only when it is told of a gap: the group outgrew the events kept, the
   * subscription fell behind them, or its reader stopped reading. A type with a `key` promises less: see `key`. For a
   * type with a check function the order holds among what is emitted, but not between what is emitted and what the
   * check function finds, which may arrive later or again.
   *
   * The data is serialised when it is emitted, so data that cannot be sent as JSON throws here, before anything is
   * kept or sent.
   */
  emit(data: D, options?: { eventId?: string; timestamp?: string; subscription?: string }): void;
  /**
   * The position after the last occurrence emitted, for a type without a check function. Return it with the state
   * a tool reads, in the same synchronous run, and a client that subscribes from it hears every change after that
   * state and none before. A type with a check function has no such position here: its cursor is the source's own,
   * so read the source's head instead. This throws for such a type.
   */
  cursor(): string;
  /**
   * Ends one subscription, or all of this type's. A stream is told `error` and closed, and the next poll is answered
   * with it. Forbidden unless given.
   */
  end(subscription?: string, error?: EventError): void;
  /**
   * Stops offering this event type: its subscriptions end with NotFound. With `listChanged`, clients are told the list
   * changed.
   */
  remove(): void;
}
export interface EventsOptions {
  /** What each event type without a check function keeps of what it emits, for polls and reconnecting streams. */
  keep?: {
    /** How many events. Ten thousand unless given. */
    events?: number;
    /** For how long, in milliseconds. Ten minutes unless given. */
    age?: number;
    /** How many bytes they take, as JSON. The newest is kept whatever it takes. 4 MiB unless given. */
    bytes?: number;
  };
  /**
   * How many notifications a stream sends that its reader has not read, before it stops sending. Once the reader has
   * read them, it is told of a gap and goes on from the newest. A thousand unless given.
   *
   * Over HTTP the MCP SDK queues what a stream sends without waiting for its reader, and has no public way to say how
   * much waits. On its per-request transport, the one modern clients reach, the stream measures its queue by reading a
   * private field of the SDK: it stops at this limit and at `maxQueuedBytes`, and a reader that takes nothing for two
   * heartbeats has its stream closed, which frees its place. On any transport that cannot be measured, such as the
   * one the handler serves 2025 clients with, the stream is recycled instead: it ends cleanly once it has handed over
   * `maxQueuedBytes`, and its client comes back from its cursor, losing nothing if it was keeping up. A public
   * backpressure signal in the SDK would remove the private read. Over stdio the SDK waits for the reader, so nothing
   * is queued.
   *
   * What a stream handed over and its reader has not taken stays in memory after the stream ends, so it stays counted,
   * against its caller's `maxSubscriptionsPerCaller` and against `maxQueuedTotal`, until it is gone. Where the stream
   * was measured, that is when its queue is empty or its connection closed. Where it was not, nothing says when its
   * reader takes it, so it stays counted for ten heartbeats (five minutes by default) or until its connection is known
   * to have closed. A client that opens streams and never reads them therefore holds at most `maxQueuedTotal` at once
   * where streams are measured; where they are not, it can add at most `maxQueuedTotal` more every ten heartbeats for
   * as long as it keeps its connections open.
   */
  maxQueued?: number;
  /**
   * How many bytes those notifications take, as JSON; on a stream that is recycled, how many it hands over in its
   * life. An event is sent alone when nothing waits, whatever it weighs. 1 MiB unless given.
   */
  maxQueuedBytes?: number;
  /**
   * How many bytes every stream over HTTP may hold for readers that have not read them: what is measured waiting, a
   * whole `maxQueuedBytes` for each stream that cannot be measured (and each new stream, until its first frame shows
   * which it is), what a type with a check function has emitted and a stream has yet to send, and what ended streams
   * still hold. Past it, new streams are refused with ResourceExhausted and measured ones stop growing. 16 MiB unless
   * given. With the defaults, an app that sets nothing holds at most 16 MiB queued and 4 MiB kept per event type.
   */
  maxQueuedTotal?: number;
  /**
   * How long a poll is told to wait before the next, and how often a stream asks a check function, in milliseconds,
   * for every event type that does not give its own. One second unless given.
   */
  interval?: number;
  /** How often a stream hears from the server when nothing happens, in milliseconds. Thirty seconds unless given. */
  heartbeat?: number;
  /**
   * How long a poll subscription lasts after its last poll, in milliseconds, before it ends. A minute, or three of
   * the type's intervals when that is longer, unless given.
   */
  pollLease?: number;
  /**
   * How many subscriptions may be held at once, by every delivery mode: each stream and each poll lease counts. Ten
   * thousand unless given. Past it a subscription is refused with ResourceExhausted.
   */
  maxSubscriptions?: number;
  /**
   * How many of those one caller may hold, a stream that has ended counting while what it handed over is unread. A
   * hundred unless given. Callers without an identity cannot be told apart, so they count together as one caller.
   */
  maxSubscriptionsPerCaller?: number;
  /** How many event types events/list returns at a time. A hundred unless given. */
  pageSize?: number;
  /** Clients are told when event types are removed or declared while the servers run, where their connection lasts. */
  listChanged?: boolean;
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

/** An occurrence as subscriptions receive it, at the cursor after it when it has one. */
export interface Occurrence { eventId: string; name: string; timestamp: string; data: unknown; _meta?: Record<string, unknown>; cursor?: string | null }
/** An emitted event: kept, at a sequence, for a type without a check function; pushed only, for one with. */
export interface Kept { sequence?: number; at?: number; target?: string | undefined; occurrence: Occurrence; size: number; replaces?: string | undefined }
/** What a subscription is owed after a cursor. */
export interface Owed {
  events: Occurrence[];
  /** Events that could not be shaped for it, and were skipped. */
  failures?: EventError[];
  /** Where delivery starts. */
  start: string | null;
  cursor: string | null;
  truncated: boolean;
  hasMore: boolean;
}
/** A subscription as a delivery mode holds it. */
export interface Held {
  readonly id: string;
  readonly name: string;
  readonly delivery: DeliveryModeName;
  readonly arguments: unknown;
  readonly context: SubscriptionContext;
  /** Nothing is emitted to it alone: a poll lease shared by callers without an identity. */
  untargetable?: boolean;
  /** Called when the app ends the subscription. */
  readonly end: (error: EventError) => void;
  /** Says the hold is over. */
  close(): void;
}
/** The subscription a request asks for, checked. */
export interface Requested { id: string; lease: string; arguments: unknown; context: SubscriptionContext; untargetable?: boolean }
/** A declared event type, as the delivery modes see it. */
export interface EventTypeState {
  readonly name: string;
  readonly delivery: DeliveryModeName[];
  readonly interval: number;
  readonly check?: EventDefinition<unknown, unknown>["check"];
  /** Told each event as it is emitted: a push stream is one, and a delivery mode adds its own. */
  readonly sinks: Set<(kept: Kept) => void>;
  /** The subscriptions held by every mode, by id. */
  readonly subscriptions: Map<string, { held: Set<Held>; ready: Promise<unknown> }>;
}
/** What a delivery mode works with. */
export interface Internals {
  readonly types: Map<string, EventTypeState>;
  /** Checks a request, names its event type and the subscription's id. */
  readonly subscription: (request: Record<string, unknown>, context: SubscriptionContext, delivery?: DeliveryModeName) => Promise<{ type: EventTypeState; subscription: Requested }>;
  /** Begins holding a subscription. */
  readonly open: (type: EventTypeState, subscription: { id: string; delivery: DeliveryModeName; arguments: unknown; context: SubscriptionContext }, end: (error: EventError) => void) => Promise<Held>;
  /** What a subscription is owed after a cursor. */
  readonly read: (type: EventTypeState, subscription: Pick<Held, "id" | "arguments" | "context" | "untargetable">, cursor: string | null | undefined, options?: { maxAgeMs?: number; maxEvents?: number }) => Owed | Promise<Owed>;
  /** What a subscription is owed of the events emitted. */
  readonly since: (type: EventTypeState, subscription: Pick<Held, "id" | "arguments" | "context" | "untargetable">, cursor: string | null | undefined, maxAgeMs?: number, limit?: number) => Owed;
  /** An emitted event as one subscription receives it, or nothing when it is not for it. */
  readonly shape: (type: EventTypeState, kept: Kept, subscription: Pick<Held, "id" | "arguments" | "context" | "untargetable">, failed?: (error: EventError) => void) => Occurrence | undefined;
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
  notification(notification: { method: string }): Promise<void>;
  onclose?: (() => void) | undefined;
  transport?: unknown;
}
interface Context {
  mcpReq: { id: string | number; signal: AbortSignal; notify(notification: { method: string; params: object }): Promise<void> };
  http?: SubscriptionContext & { req?: { signal?: AbortSignal } };
}
interface Type<A = any, D = any> extends EventTypeState {
  readonly order: number;
  readonly description?: string | undefined;
  readonly inputSchema: EventSchema<A>;
  readonly payloadSchema: EventSchema;
  readonly _meta?: Record<string, unknown> | undefined;
  readonly match?: EventDefinition<A, D>["match"];
  readonly transform?: EventDefinition<A, D>["transform"];
  readonly authorize?: EventDefinition<A, D>["authorize"];
  readonly onSubscribe?: EventDefinition<A, D>["onSubscribe"];
  readonly key?: EventDefinition<A, D>["key"];
  sequence: number;
  /** What the events kept take, in bytes. */
  bytes: number;
  /** The event kept last for each key. */
  latest: Map<string, Kept & { sequence: number }>;
  dropped: number;
  kept: Array<Kept & { sequence: number; at: number }>;
  /** Subscriptions owed word of a gap, for events emitted to them alone that they could not be given. */
  owed: Map<string, true>;
}
interface Lease { type: Type; opening?: Promise<Held>; ended?: EventError; release?: () => void; timer?: ReturnType<typeof setTimeout> }

const SUBSCRIPTION = "io.modelcontextprotocol/subscriptionId";
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
const FORBIDDEN = -32024;
const RESOURCE_EXHAUSTED = -32025;
const UNSUPPORTED = -32026;
// Requests are checked here, against each event type's own schema.
const params = { "~standard": { version: 1, vendor: "holon-sh", validate: (value: unknown) => ({ value: value ?? {} }) } };

const refusal = ({ code, message, data }: EventError) => new ProtocolError(code, message, data);
const removed: EventError = { code: NOT_FOUND, message: "NotFound", data: { kind: "event" } };
const forbidden: EventError = { code: FORBIDDEN, message: "Forbidden" };
// What a client is told of a failure: its code when it is a JSON-RPC one, and its message.
const described = (error: any): EventError => ({
  code: Number.isInteger(error?.code) ? error.code : INTERNAL_ERROR,
  message: error?.message || "InternalError",
  ...(error?.data !== undefined && { data: error.data }),
});
// Arguments are the same subscription whatever order their keys came in.
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical((value as Record<string, unknown>)[key])]))
  : value;
// Who asked, as Holon admitted them: the user, the client acting for them, the agent when one acts for the user, and
// what the token allows. A caller without a subject has no identity: nobody can tell it from another such caller.
const caller = (context: SubscriptionContext): string | null => {
  const authInfo = context?.authInfo;
  const { iss = null, sub, act = null } = authInfo?.extra ?? {};
  if (!authInfo || typeof sub !== "string") return null;
  return JSON.stringify(canonical([iss, sub, authInfo.clientId ?? null, act, [...authInfo.scopes ?? []].sort()]));
};
const hex = (bytes: Uint8Array) => [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
// A subscription's id is the same for the same caller, event type and arguments, so it survives reconnects and poll
// leases, as a webhook subscription's does. It is made with the global crypto, which needs no node:crypto at load.
const identify = async (who: string | null, name: string, args: unknown) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([who, name, canonical(args)])));
  return `sub_${hex(new Uint8Array(digest, 0, 16))}`;
};
// A caller without an identity gets an id of its own for each stream.
const unique = () => `sub_${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
// How many bytes a message takes as JSON, as the limits on what is kept and queued count them.
const encoder = new TextEncoder();
const bytes = (value: unknown) => encoder.encode(JSON.stringify(value)).byteLength;
// The MCP SDK queues a notification on an HTTP response without waiting for the reader, and has no public way to say
// how much waits. This reads a private field of its per-request HTTP transport: the response's stream controller,
// whose desiredSize falls by one for each frame waiting. It answers undefined where the field is absent (the
// handler's fallback transport, or a release that renames it), and a stream is then bounded by what it hands over in
// its lifetime instead. A public backpressure signal in the SDK would replace this.
const desired = (transport: unknown): number | undefined => {
  const size = (transport as { _sse?: { controller?: { desiredSize?: unknown } } } | undefined)?._sse?.controller?.desiredSize;
  return typeof size === "number" ? size : undefined;
};
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = (run: () => unknown) => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value: unknown, minimum: number) => value === undefined || Number.isInteger(value) && (value as number) >= minimum;

/**
 * Event types a process emits and the MCP servers it creates serve, in the poll and push delivery modes of MCP Events,
 * the draft extension of the Triggers & Events Working Group. Each type keeps what it emits, as `keep` bounds it, for
 * polls and for streams that reconnect: those cursors last as long as the process, and after a restart a client is
 * told that events were skipped. A type with a check function uses its source's cursors instead, which outlive the
 * process. A type is asked again, and a poll told to come back, every `interval` milliseconds unless the type says
 * otherwise. A stream hears from the server every `heartbeat` milliseconds.
 */
export function createEvents({
  keep: { events: keptEvents = 10_000, age: keptAge = 10 * 60_000, bytes: keptBytes = 4 * 2 ** 20 } = {},
  maxQueued = 1000, maxQueuedBytes = 2 ** 20, maxQueuedTotal = 16 * 2 ** 20, interval = 1000, heartbeat = 30_000,
  pollLease, maxSubscriptions = 10_000, maxSubscriptionsPerCaller = 100, pageSize = 100, listChanged = false, modes = [],
}: EventsOptions = {}): Events {
  const offered = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map<string, Type>();
  // Servers to tell when the event types change. Some are closed without having been connected, and never say so,
  // so they are held weakly.
  const served = new Set<WeakRef<Served>>();
  const forgotten = new FinalizationRegistry<WeakRef<Served>>(held => served.delete(held));
  let declared = 0;
  let subscribed = 0;
  const callers = new Map<string, number>();

  const position = (type: EventTypeState, sequence: number = (type as Type).sequence) => `${epoch}.${sequence}`;

  // An event emitted to one subscription that it could not be given is owed to it as a gap, on its next poll or
  // stream. The ids owed one are as many as the events a type keeps.
  const owe = (type: Type, id: string) => {
    type.owed.delete(id);
    type.owed.set(id, true);
    if (type.owed.size > keptEvents) type.owed.delete(type.owed.keys().next().value!);
  };

  // What a subscription is owed after a cursor from the events emitted: the ones for it, in order, where delivery
  // starts, and where it now stands. A null cursor starts from now, and so does one from another process. One past
  // the events still kept starts from the oldest kept, and says that events were skipped.
  const since: Internals["since"] = (state, subscription, cursor, maxAgeMs, limit = Infinity) => {
    const type = state as Type;
    const now = { events: [], start: position(type), cursor: position(type), hasMore: false };
    if (cursor == null) return { ...now, truncated: false };
    const [process, text] = cursor.split(".");
    const sequence = Number(text);
    if (process !== epoch || !Number.isInteger(sequence) || sequence > type.sequence) return { ...now, truncated: true };
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence);
    const recent = later.filter(kept => kept.at >= floor);
    const truncated = sequence < type.dropped || recent.length < later.length;
    const events: Occurrence[] = [];
    const failures: EventError[] = [];
    let reached = recent.length ? recent[0]!.sequence - 1 : type.sequence;
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
  const checked = async (type: Type, { arguments: args, context }: Pick<Held, "arguments" | "context">, cursor: string | null | undefined, maxAgeMs?: number, limit = Infinity): Promise<Owed> => {
    const result = await type.check!(cursor ?? null, args, context);
    const next = result?.cursor ?? null;
    // A null cursor asks for the current position and nothing before it, except of a source that has no positions:
    // each check of that is asked with null, and answers with what is new.
    if (cursor == null && next !== null) return { events: [], start: next, cursor: next, truncated: false, hasMore: false };
    const items = result?.events ?? [];
    const floor = maxAgeMs === undefined || cursor == null ? -Infinity : Date.now() - maxAgeMs;
    let truncated = next !== null && Boolean(result.truncated);
    const events: Occurrence[] = [];
    const failures: EventError[] = [];
    let reached = cursor ?? null;
    let cuttable = false;
    const answer = (end: string | null, hasMore: boolean): Owed => ({ events, failures, start: truncated || !events.length ? end : cursor ?? null, cursor: end, truncated, hasMore });
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
  const read: Internals["read"] = (type, subscription, cursor, { maxAgeMs, maxEvents } = {}) =>
    type.check ? checked(type as Type, subscription, cursor, maxAgeMs, maxEvents) : since(type, subscription, cursor, maxAgeMs, maxEvents);

  // The occurrence a subscription receives, or nothing when it is not for it. An event emitted to one subscription
  // is for that one alone, and its arguments are not asked.
  // An event that cannot be shaped for a subscription, because `match` or `transform` throws or what `transform`
  // returns cannot be sent as JSON, is skipped for that subscription alone, so its cursor moves past it. It is
  // logged, and `failed` hears of it so a stream can say so once.
  const shape: Internals["shape"] = (state, { sequence, target, occurrence }, { id, untargetable, arguments: args, context }, failed) => {
    const type = state as Type;
    let data: unknown;
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
  const skipped = (type: Type, eventId: string, error: any, failed?: (error: EventError) => void) => {
    console.error(`holon-sh/events: event ${eventId} of ${type.name} was skipped for a subscription:`, error);
    failed?.({ code: INTERNAL_ERROR, message: `Event ${eventId} could not be delivered and was skipped`, data: { eventId, reason: String(error?.message ?? error) } });
  };
  // What a check function found is skipped in the same way when it cannot be sent as JSON.
  const serialisable = (type: Type, eventId: string, value: unknown, failed: (error: EventError) => void) => {
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
  const subscription: Internals["subscription"] = async ({ name, arguments: args = {}, cursor, maxAgeMs, maxEvents }, context, delivery) => {
    const type = types.get(name as string);
    if (!type) throw refusal(removed);
    if (delivery && !type.delivery.includes(delivery)) throw refusal({ code: UNSUPPORTED, message: "Unsupported", data: { feature: "deliveryMode", value: delivery } });
    if (cursor != null && typeof cursor !== "string") throw new ProtocolError(INVALID_PARAMS, "cursor must be a string or null");
    if (!integer(maxAgeMs, 0)) throw new ProtocolError(INVALID_PARAMS, "maxAgeMs must be a non-negative integer");
    if (!integer(maxEvents, 1)) throw new ProtocolError(INVALID_PARAMS, "maxEvents must be a positive integer");
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
    const who = caller(context);
    // Polls share a lease per caller and arguments, and callers without an identity share one per arguments.
    const lease = await identify(who, type.name, checked.value);
    if (type.authorize && !(await type.authorize(checked.value, context))) {
      endSubscription(type, lease, forbidden);
      // This refusal is the answer the poll lease would have given, so the next poll begins afresh.
      leases.delete(lease);
      throw refusal(forbidden);
    }
    return { type, subscription: { id: who === null ? unique() : lease, lease, arguments: checked.value, context } };
  };

  const endSubscription = (type: EventTypeState, id: string, error: EventError) => {
    for (const held of [...type.subscriptions.get(id)?.held ?? []]) held.end(error);
  };

  // Begins holding a subscription, by a stream, a poll lease or another delivery mode: counted against the limits
  // first, so a refused one provisions nothing. The type's onSubscribe is called when the first hold of an id
  // begins, and its teardown when the last ends, so two streams of one subscription set it up once. `end` is how the
  // delivery mode is told the app ended it; `close` is how the mode says its hold is over.
  const open: Internals["open"] = async (state, { id, delivery, arguments: args, context }, end) => {
    const type = state as Type;
    if (types.get(type.name) !== type) throw refusal(removed);
    // Callers without an identity cannot be told apart, so they count together as one.
    const who = caller(context) ?? "anonymous";
    if (subscribed >= maxSubscriptions) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: maxSubscriptions } });
    if ((callers.get(who) ?? 0) >= maxSubscriptionsPerCaller) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptionsPerCaller", max: maxSubscriptionsPerCaller } });
    subscribed++;
    callers.set(who, (callers.get(who) ?? 0) + 1);
    let entry = type.subscriptions.get(id);
    if (!entry) {
      const ready = Promise.resolve().then(() => type.onSubscribe?.({ id, name: type.name, delivery, arguments: args, context }));
      ready.catch(() => {});
      entry = { held: new Set(), ready };
      type.subscriptions.set(id, entry);
    }
    const current = entry;
    let closed = false;
    const held: Held = { id, name: type.name, delivery, arguments: args, context, end, close() {
      if (closed) return;
      closed = true;
      subscribed--;
      const count = callers.get(who) ?? 1;
      if (count === 1) callers.delete(who);
      else callers.set(who, count - 1);
      current.held.delete(held);
      if (current.held.size) return;
      if (type.subscriptions.get(id) === current) type.subscriptions.delete(id);
      current.ready.then(teardown => { if (typeof teardown === "function") settle(teardown as () => unknown); }, () => {});
    } };
    current.held.add(held);
    try {
      await current.ready;
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
  const leases = new Map<string, Lease>();
  const lease = async (type: Type, { lease: key, ...subscribed }: Requested): Promise<Held> => {
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
      const fresh: Lease = { type };
      lent = fresh;
      leases.set(key, fresh);
      fresh.opening = open(type, { ...subscribed, id: key, delivery: "poll" }, error => {
        fresh.ended = error;
        fresh.release?.();
      });
      fresh.opening.then(held => {
        if (shared) held.untargetable = true;
        fresh.release = () => held.close();
        if (fresh.ended) held.close();
      }, () => { if (leases.get(key) === fresh) leases.delete(key); });
    }
    const current = lent;
    const held = await current.opening!;
    // Ended while it was being set up.
    if (current.ended) {
      leases.delete(key);
      throw refusal(current.ended);
    }
    clearTimeout(current.timer);
    current.timer = setTimeout(() => {
      if (leases.get(key) === current) leases.delete(key);
      held.close();
    }, pollLease ?? Math.max(60_000, 3 * type.interval));
    current.timer.unref?.();
    return held;
  };

  // What every stream over HTTP may hold for readers that have not read it: the bytes measured waiting, a whole
  // budget for each stream that cannot be measured, what check types emitted and streams have yet to send, and what
  // ended streams still hold.
  let queued = 0;
  const exhausted = () => refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "queuedBytes", max: maxQueuedTotal } });
  // Streams are looked at by one coarse timer for the process, not a timer each.
  const watched = new Set<() => void>();
  let ticking: ReturnType<typeof setInterval> | undefined;
  const watch = (look: () => void) => {
    watched.add(look);
    ticking ??= setInterval(() => {
      for (const each of watched) each();
      if (!watched.size) ticking = void clearInterval(ticking);
    }, 1000);
    ticking.unref?.();
    return () => { watched.delete(look); };
  };
  const counted = (who: string, by: number) => {
    const count = (callers.get(who) ?? 0) + by;
    if (count > 0) callers.set(who, count);
    else callers.delete(who);
  };
  // What an ended stream handed over and its reader has not taken is still in memory, so it stays counted, against
  // the process's budget and its caller's limit, until it is gone: its queue measured empty, its connection closed,
  // or, where neither can be known, ten heartbeats on.
  const linger = (charge: number, who: string, transport: unknown, signal: AbortSignal | undefined) => {
    if (charge <= 0) return;
    queued += charge;
    counted(who, 1);
    const until = Date.now() + 10 * heartbeat;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      unwatch();
      signal?.removeEventListener("abort", release);
      queued -= charge;
      counted(who, -1);
    };
    const unwatch = watch(() => {
      const size = desired(transport);
      // A closed queue measures one frame short, so one holding no more than its last frame counts as taken.
      if (size !== undefined ? size >= 0 : Date.now() > until) release();
    });
    if (signal?.aborted) release();
    else signal?.addEventListener("abort", release, { once: true });
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
  const internals: Internals = { types, subscription, open, read, since, shape, position };

  return {
    [INTERNALS]: internals,
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each. `check` returns what happened after a
     * cursor, for event types whose source keeps its own history.
     */
    event<A, D>(name: string, { description, inputSchema, payloadSchema, _meta, match, transform, key, check, interval: every = interval, delivery = offered, authorize, onSubscribe }: EventDefinition<A, D>): Emitter<D> {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      const type: Type<A, D> = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, match, transform, key, check: check as Type["check"], interval: every, delivery, authorize, onSubscribe,
        sequence: 0, dropped: 0, kept: [], bytes: 0, latest: new Map(), sinks: new Set(), subscriptions: new Map(), owed: new Map(),
      };
      // Events kept, oldest first, each placed by its sequence.
      const find = (sequence: number) => {
        let low = 0;
        let high = type.kept.length;
        while (low < high) {
          const middle = (low + high) >> 1;
          if (type.kept[middle]!.sequence < sequence) low = middle + 1;
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
          // Data that cannot be sent as JSON is refused here, before anything is kept or sent.
          const size = bytes(occurrence);
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            // An event for one subscription that has no stream to take it is lost.
            if (target !== undefined && ![...type.subscriptions.get(target)?.held ?? []].some(held => held.delivery !== "poll")) owe(type, target);
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
          while (type.kept.length > 1 && (type.kept.length > keptEvents || type.bytes > keptBytes || type.kept[0]!.at < kept.at - keptAge)) {
            const oldest = type.kept.shift()!;
            type.dropped = oldest.sequence;
            type.bytes -= oldest.size;
            if (oldest.replaces && type.latest.get(oldest.replaces) === oldest) type.latest.delete(oldest.replaces);
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
      const server: Served = (mcp as { server?: Served }).server ?? mcp as Served;
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
      const json = (schema: EventSchema) => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
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
          ...(start + pageSize < all.length && { nextCursor: String(page.at(-1)!.order) }),
        };
      });
      for (const mode of modes) mode.serve(server, internals);

      server.setRequestHandler("events/poll", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "poll");
        const held = await lease(type as Type, subscribed);
        // Each poll is answered for its own caller, with the lease's id.
        const { events, start, failures, truncated, ...rest } = await read(type, { ...subscribed, id: held.id, untargetable: held.untargetable }, request.cursor, request);
        const lost = !held.untargetable && (type as Type).owed.delete(held.id);
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, truncated: truncated || lost, nextPollMs: type.interval };
      });

      server.setRequestHandler("events/stream", { params }, async (request, ctx) => {
        const { type: state, subscription: subscribed } = await subscription(request, ctx.http, "push");
        const type = state as Type;
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION]: ctx.mcpReq.id };
        const who = caller(subscribed.context) ?? "anonymous";
        // How what a reader has not read is bounded. Over HTTP the SDK queues without waiting: a stream is measured
        // where the probe can see its queue, and otherwise recycled, ended cleanly once it has handed over its budget
        // so its client reconnects from its cursor. Elsewhere, as over stdio, sending waits for the reader. The SDK
        // makes the queue when the first frame is written, so which it is is known only then; until then the stream
        // holds a whole budget, as one that cannot be measured does for its life, and the process admits no more
        // streams than it has budgets for.
        const http = ctx.http !== undefined;
        let measured = false;
        let recycled = http;
        let decided = !http;
        let transport: unknown;
        let reserved = http ? maxQueuedBytes : 0;
        if (http && queued + reserved > maxQueuedTotal) throw exhausted();
        queued += reserved;
        let done = false;
        let ending: EventError | undefined;
        let wake = () => {};
        const finish = () => {
          done = true;
          wake();
        };
        let held: Held;
        try {
          held = await open(type, { ...subscribed, delivery: "push" }, error => {
            ending = error;
            finish();
          });
        } catch (error) {
          queued -= reserved;
          throw error;
        }
        // A client that left while the subscription was being set up is not waited for.
        if (signal.aborted || ending) {
          held.close();
          queued -= reserved;
          // Ended while it was being set up: no stream is opened, and the request is refused.
          if (ending) throw refusal(ending);
          return { _meta: {} };
        }
        signal.addEventListener("abort", finish, { once: true });
        // The sizes of the frames handed over and, where measured, not yet read, newest last.
        let unread: number[] = [];
        let unreadBytes = 0;
        let handed = 0;
        let eventsHanded = 0;
        const account = () => {
          const size = desired(transport);
          const count = size === undefined ? 0 : Math.max(0, 1 - size);
          if (count < unread.length) unread = unread.slice(unread.length - count);
          const now = unread.reduce((sum, each) => sum + each, 0);
          queued += now - unreadBytes;
          unreadBytes = now;
          return count;
        };
        // A measured stream whose reader takes nothing for two heartbeats is closed, which frees its place; its
        // client reconnects from its cursor if it is still there.
        let overflowed = false;
        let progress = Date.now();
        let seen = 0;
        const look = () => {
          const count = account();
          if (count < seen || count === 0) progress = Date.now();
          seen = count;
          if (count && Date.now() - progress > 2 * heartbeat) finish();
          else if (overflowed && !count) wake();
        };
        let unwatch = () => {};
        // A stream that cannot be written to is over. Every frame is counted, whatever it says.
        const notify = async (method: string, body: object) => {
          if (signal.aborted) return;
          const params = { ...body, _meta: meta };
          const size = bytes(params);
          if (measured) {
            unread.push(size);
            unreadBytes += size;
            queued += size;
          } else handed += size;
          try {
            await ctx.mcpReq.notify({ method: `notifications/events/${method}`, params });
          } catch {
            finish();
          }
          if (!decided) {
            decided = true;
            transport = server.transport;
            if (desired(transport) !== undefined) {
              measured = true;
              recycled = false;
              queued -= reserved;
              reserved = 0;
              unwatch = watch(look);
            }
          }
        };
        // The stream follows its cursor: emitted events wake it, and a type with a check function is asked again
        // every interval. What it is owed waits in the buffer or the source, and is read a queue's worth at a time.
        let cursor: string | null = request.cursor ?? null;
        let behind = true;
        // What a type with a check function emitted and the stream has yet to send, counted against the process's
        // budget. Past the bounds the oldest is let go, and the reader is told of the gap.
        const pushed: Kept[] = [];
        let pushedBytes = 0;
        let lost = false;
        const unpush = (kept: Kept) => {
          pushedBytes -= kept.size;
          queued -= kept.size;
        };
        const sink = (kept: Kept) => {
          if (type.check) {
            const older = kept.replaces ? pushed.findIndex(waiting => waiting.replaces === kept.replaces) : -1;
            if (older >= 0) unpush(pushed.splice(older, 1)[0]!);
            pushed.push(kept);
            pushedBytes += kept.size;
            queued += kept.size;
            while (pushed.length > 1 && (pushed.length > maxQueued || pushedBytes > maxQueuedBytes || queued > maxQueuedTotal)) {
              unpush(pushed.shift()!);
              lost = true;
            }
          } else behind = true;
          wake();
        };
        // Whether an event may be handed over now. An event is sent alone when nothing waits, whatever it weighs.
        const room = (size: number) => {
          if (recycled) return eventsHanded === 0 || handed + size <= maxQueuedBytes;
          if (!measured) return true;
          const count = account();
          return count === 0 || count < maxQueued && unreadBytes + size <= maxQueuedBytes && queued + size <= maxQueuedTotal;
        };
        const send = async (event: Occurrence) => {
          if (!room(bytes(event))) {
            // A stream that cannot be measured ends here, and its client comes back from its cursor.
            if (recycled) finish();
            else overflowed = true;
            return false;
          }
          eventsHanded++;
          await notify("event", event);
          cursor = event.cursor ?? null;
          return true;
        };
        type.sinks.add(sink);
        let beat: ReturnType<typeof setInterval> | undefined;
        let beating = false;
        const heartbeats = () => setInterval(async () => {
          if (beating || overflowed) return;
          beating = true;
          try {
            // Access is checked again while the subscription lasts, and one that is lost ends it.
            if (type.authorize && !(await type.authorize(subscribed.arguments, subscribed.context))) return endSubscription(type, held.id, forbidden);
            // A stream that cannot be measured is recycled before its heartbeats outgrow its budget too.
            if (recycled && handed + bytes({ cursor, _meta: meta }) > maxQueuedBytes) return finish();
            await notify("heartbeat", { cursor });
          } catch (error) {
            await notify("error", { error: described(error) });
          } finally {
            beating = false;
          }
        }, heartbeat);
        let first = true;
        try {
          let due = 0;
          while (!done) {
            if (overflowed) {
              // Nothing more is sent until the reader has read what waits; the process's timer says when.
              while (!done && account()) await new Promise<void>(resolve => { wake = resolve; });
              wake = () => {};
              if (done) break;
              let head = cursor;
              try {
                // A source without positions has no newest to go on from: its next check answers with what is new.
                head = type.check ? cursor === null ? null : (await read(type, held, null)).cursor : position(type);
              } catch (error) {
                await notify("error", { error: described(error) });
              }
              cursor = head;
              while (pushed.length) unpush(pushed.shift()!);
              overflowed = false;
              lost = false;
              behind = false;
              due = Date.now() + type.interval;
              // A source without positions has nothing to have skipped past, so it is not told of a gap.
              if (cursor !== null) await notify("active", { cursor, truncated: true });
            }
            if (type.check ? Date.now() >= due : behind) {
              behind = false;
              let result: Owed | undefined;
              try {
                result = await read(type, held, cursor, { maxEvents: maxQueued, ...(first && request.maxAgeMs !== undefined && { maxAgeMs: request.maxAgeMs }) });
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
              const kept = pushed[0]!;
              let failure: EventError | undefined;
              const event = shape(type, kept, held, error => { failure = error; });
              if (failure) await notify("error", { error: failure });
              if (event && !(await send({ ...event, cursor }))) break;
              if (pushed[0] === kept) unpush(pushed.shift()!);
            }
            if (done) break;
            if (overflowed) continue;
            let timer: ReturnType<typeof setTimeout> | undefined;
            await new Promise<void>(resolve => {
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
          unwatch();
          type.sinks.delete(sink);
          // What was emitted to this subscription alone and not sent is owed to it as a gap when it comes back.
          if (held.id === subscribed.lease && pushed.some(kept => kept.target === held.id)) owe(type, held.id);
          while (pushed.length) unpush(pushed.shift()!);
          held.close();
          // What the stream handed over and its reader has not taken stays counted until it is gone.
          if (measured) account();
          queued -= reserved + unreadBytes;
          if (measured) linger(unreadBytes, who, transport, ctx.http?.req?.signal);
          else if (recycled) linger(handed, who, transport, ctx.http?.req?.signal);
        }
        // The final frame, sent when the server ends the stream; when the client did, nobody is listening.
        return { _meta: {} };
      });
    },
  };
}

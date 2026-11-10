// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// It serves the poll and push delivery modes. Another delivery mode is a module of its own, given to createEvents,
// which reaches the event types through the internals below.
import { ProtocolError } from "@modelcontextprotocol/server";
import type { McpServer, Server, ServerContext, StandardSchemaV1 } from "@modelcontextprotocol/server";

/** A schema that validates a value and describes itself as JSON Schema, as Zod's schemas do. */
export interface EventSchema<T = unknown> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types?: { readonly input: unknown; readonly output: T };
    readonly validate: (value: unknown) => { readonly value: T; readonly issues?: undefined } | { readonly issues: ReadonlyArray<{ readonly message: string }> } | Promise<{ readonly value: T; readonly issues?: undefined } | { readonly issues: ReadonlyArray<{ readonly message: string }> }>;
    readonly jsonSchema: { readonly input: (options: { target: "draft-2020-12" }) => object };
  };
}
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
   * reconnecting streams learn of it from the check function, and one emitted to a subscription with no open stream
   * is lost, so that subscription's next poll or stream is told of a gap.
   *
   * Emitting is synchronous. Occurrences emitted one after another in the same synchronous run reach each
   * subscription in that order, with no other occurrence of this type between them, whether polled or pushed. So a
   * group of changes that nothing may come between is either emitted in one run or sent as one occurrence holding a
   * list. A subscription skips part of a group only when it is told of a gap: the group outgrew the events kept, or
   * the subscription fell behind them. For a type with a check function the order holds among what is emitted, but
   * not between what is emitted and what the check function finds, which may arrive later or again.
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
  };
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
   * How many of those one caller may hold. A thousand unless given. Callers without an identity cannot be told
   * apart, so they count together as one caller.
   */
  maxSubscriptionsPerCaller?: number;
  /** How many event types events/list returns at a time. A hundred unless given. */
  pageSize?: number;
  /** Clients are told when event types are removed or declared while the servers run, where their connection lasts. */
  listChanged?: boolean;
  /** Delivery modes besides poll and push, each from a module of its own. */
  modes?: DeliveryMode[];
}
/**
 * A delivery mode besides poll and push. It registers its requests on each server, a Server of
 * @modelcontextprotocol/server, and is listed by events/list. Servers are typed loosely here so that a client, which
 * does not install the server package, can read these types.
 */
export interface DeliveryMode {
  readonly name: string;
  serve(server: object, internals: Internals): void;
  /** Called as each event type is declared, before any server is served. */
  declared?(type: EventType, internals: Internals): void;
}
/** The event types of a process, served by each MCP server it creates. */
export interface Events {
  /** Not for applications: what a delivery mode works with. */
  readonly [INTERNALS]: Internals;
  /** Declares an event type. Emit its occurrences with the returned emitter. */
  event<A, D>(name: string, definition: EventDefinition<A, D>): Emitter<D>;
  /** Serves events/list, events/poll and events/stream on an McpServer or a Server, and declares the extension. */
  serve(server: object): void;
}

// What delivery modes work with. Not for applications.

/** An occurrence as it was emitted. */
export interface Occurrence { eventId: string; name: string; timestamp: string; data: unknown; _meta?: Record<string, unknown> }
/** An occurrence as one subscription receives it, with the position after it when the type keeps what it emits. */
export interface Shaped extends Occurrence { cursor?: string | null }
/** An emitted event as sinks hear it: with its position when the type keeps it, and the subscription it is for. */
export interface Emitted { sequence?: number; at?: number; target?: string | undefined; occurrence: Occurrence }
interface Stored extends Emitted { sequence: number; at: number }
/** The subscription a read or a shape is for. */
export interface Reader { id: string; untargetable?: boolean; arguments: unknown; context: SubscriptionContext }
/** What a subscription is owed after a cursor: its events, the failures among them, where delivery starts and stands. */
export interface Owed { events: Shaped[]; failures: EventError[]; start: string | null; cursor: string | null; truncated: boolean; hasMore: boolean }
/** One delivery mode's hold on a subscription. `end` is how the app ends it, `close` how the mode lets go of it. */
export interface Held extends Subscription<unknown> {
  readonly end: (error: EventError) => void;
  close(): void;
  untargetable?: boolean;
}
/** An event type as delivery modes see it. */
export interface EventType {
  name: string;
  order: number;
  description?: string | undefined;
  inputSchema: EventSchema<unknown>;
  payloadSchema: EventSchema;
  _meta?: Record<string, unknown> | undefined;
  match?: ((data: unknown, args: unknown, context: SubscriptionContext) => boolean) | undefined;
  transform?: ((data: unknown, args: unknown, context: SubscriptionContext) => unknown) | undefined;
  check?: ((cursor: string | null, args: unknown, context: SubscriptionContext) => CheckResult<unknown> | Promise<CheckResult<unknown>>) | undefined;
  interval: number;
  delivery: DeliveryModeName[];
  authorize?: ((args: unknown, context: SubscriptionContext) => boolean | Promise<boolean>) | undefined;
  onSubscribe?: ((subscription: Subscription<unknown>) => void | (() => unknown) | Promise<void | (() => unknown)>) | undefined;
  sequence: number;
  dropped: number;
  kept: Stored[];
  sinks: Set<(emitted: Emitted) => void>;
  subscriptions: Map<string, { held: Set<Held>; ready: Promise<void | (() => unknown)> }>;
  owed: Map<string, true>;
}
/** The fields of an events request this module checks. */
export interface EventsRequest { name?: string; arguments?: unknown; cursor?: string | null; maxAgeMs?: number; maxEvents?: number; [field: string]: unknown }
/** What a delivery mode works with. */
export interface Internals {
  types: Map<string, EventType>;
  /** Checks a request as the sketch's errors require, and names its event type and the subscription's id. */
  subscription(request: EventsRequest, context: SubscriptionContext, delivery?: DeliveryModeName): Promise<{ type: EventType; subscription: Reader & { lease: string } }>;
  /** Begins holding a subscription, counted against the limits, with the type's onSubscribe run. */
  open(type: EventType, subscription: { id: string; delivery: DeliveryModeName; arguments: unknown; context: SubscriptionContext }, end: (error: EventError) => void): Promise<Held>;
  /** What a subscription is owed after a cursor, whichever way its type learns of events. */
  read(type: EventType, subscription: Reader, cursor: string | null | undefined, options?: { maxAgeMs?: number | undefined; maxEvents?: number | undefined }): Owed | Promise<Owed>;
  since(type: EventType, subscription: Reader, cursor: string | null | undefined, maxAgeMs?: number, limit?: number): Owed;
  shape(type: EventType, emitted: Emitted, subscription: Reader, failed?: (error: EventError) => void): Shaped | undefined;
  /** A type's cursor, after the last event it kept unless given another. */
  position(type: EventType, sequence?: number): string;
}

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
export const INTERNALS: unique symbol = Symbol.for("holon-sh.events.internals");
// Requests are checked here, against each event type's own schema.
const params: StandardSchemaV1<unknown, EventsRequest> = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: (value ?? {}) as EventsRequest }) } };

const refusal = ({ code, message, data }: EventError) => new ProtocolError(code, message, data);
const removed: EventError = { code: NOT_FOUND, message: "NotFound", data: { kind: "event" } };
const forbidden: EventError = { code: FORBIDDEN, message: "Forbidden" };
// What a client is told of a failure: its code when it is a JSON-RPC one, and its message.
const described = (error: unknown): EventError => {
  const { code, message, data } = (error ?? {}) as Partial<EventError>;
  return { code: Number.isInteger(code) ? code! : INTERNAL_ERROR, message: message || "InternalError", ...(data !== undefined && { data }) };
};
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
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = (run: () => unknown) => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value: unknown, minimum: number) => value === undefined || Number.isInteger(value) && (value as number) >= minimum;

/**
 * Event types served as MCP Events, the draft extension of the Triggers & Events Working Group, in its poll and push
 * delivery modes. An event type either has a check function, whose cursors are its source's and outlive the process,
 * or keeps what it emits in memory, whose cursors last as long as the process: after a restart a client is told that
 * events were skipped. Each type keeps what it emits, as `keep` bounds it, for polls and for streams that reconnect.
 * A type is asked again, and a poll told to come back, every `interval` milliseconds unless the type says otherwise.
 * A stream hears from the server every `heartbeat` milliseconds.
 */
export function createEvents({
  keep: { events: keptEvents = 10_000, age: keptAge = 10 * 60_000 } = {}, interval = 1000, heartbeat = 30_000,
  pollLease, maxSubscriptions = 10_000, maxSubscriptionsPerCaller = 1000, pageSize = 100, listChanged = false, modes = [],
}: EventsOptions = {}): Events {
  const offered = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map<string, EventType>();
  // Servers to tell when the event types change. Some are closed without having been connected, and never say so,
  // so they are held weakly.
  const served = new Set<WeakRef<Server>>();
  const forgotten = new FinalizationRegistry<WeakRef<Server>>(held => served.delete(held));
  let declared = 0;
  let subscribed = 0;
  const callers = new Map<string, number>();

  const position = (type: EventType, sequence = type.sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor from the events emitted: the ones for it, in order, where delivery
  // starts, and where it now stands. A null cursor starts from now, and so does one from another process. One past
  // the events still kept starts from the oldest kept, and says that events were skipped.
  const since = (type: EventType, subscription: Reader, cursor: string | null | undefined, maxAgeMs?: number, limit = Infinity): Owed => {
    const now = { events: [], failures: [], start: position(type), cursor: position(type), hasMore: false };
    if (cursor == null) return { ...now, truncated: false };
    const [process, text] = cursor.split(".");
    const sequence = Number(text);
    if (process !== epoch || !Number.isInteger(sequence) || sequence > type.sequence) return { ...now, truncated: true };
    const floor = maxAgeMs === undefined ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence);
    const recent = later.filter(kept => kept.at >= floor);
    const truncated = sequence < type.dropped || recent.length < later.length;
    const events: Shaped[] = [];
    const failures: EventError[] = [];
    let reached = recent[0] ? recent[0].sequence - 1 : type.sequence;
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
  const checked = async (type: EventType, { arguments: args, context }: Reader, cursor: string | null | undefined, maxAgeMs?: number, limit = Infinity): Promise<Owed> => {
    const result = await type.check!(cursor ?? null, args, context);
    const next = result?.cursor ?? null;
    // A null cursor asks for the current position and nothing before it, except of a source that has no positions:
    // each check of that is asked with null, and answers with what is new.
    if (cursor == null && next !== null) return { events: [], failures: [], start: next, cursor: next, truncated: false, hasMore: false };
    const items = result?.events ?? [];
    const floor = maxAgeMs === undefined || cursor == null ? -Infinity : Date.now() - maxAgeMs;
    let truncated = next !== null && Boolean(result.truncated);
    const events: Shaped[] = [];
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
  const read = (type: EventType, subscription: Reader, cursor: string | null | undefined, { maxAgeMs, maxEvents }: { maxAgeMs?: number | undefined; maxEvents?: number | undefined } = {}): Owed | Promise<Owed> =>
    type.check ? checked(type, subscription, cursor, maxAgeMs, maxEvents) : since(type, subscription, cursor, maxAgeMs, maxEvents);

  // The occurrence a subscription receives, or nothing when it is not for it. An event emitted to one subscription
  // is for that one alone, and its arguments are not asked.
  // An event that cannot be shaped for a subscription, because `match` or `transform` throws or what `transform`
  // returns cannot be sent as JSON, is skipped for that subscription alone, so its cursor moves past it. It is
  // logged, and `failed` hears of it so a stream can say so once.
  const shape = (type: EventType, { sequence, target, occurrence }: Emitted, { id, untargetable, arguments: args, context }: Reader, failed?: (error: EventError) => void): Shaped | undefined => {
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
  const skipped = (type: EventType, eventId: string, error: unknown, failed?: (error: EventError) => void) => {
    console.error(`holon-sh/events: event ${eventId} of ${type.name} was skipped for a subscription:`, error);
    failed?.({ code: INTERNAL_ERROR, message: `Event ${eventId} could not be delivered and was skipped`, data: { eventId, reason: String((error as Error)?.message ?? error) } });
  };
  // What a check function found is skipped in the same way when it cannot be sent as JSON.
  const serialisable = (type: EventType, eventId: string, value: unknown, failed: (error: EventError) => void) => {
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
    const type = typeof name === "string" ? types.get(name) : undefined;
    if (!type) throw refusal(removed);
    if (delivery && !type.delivery.includes(delivery)) throw refusal({ code: UNSUPPORTED, message: "Unsupported", data: { feature: "deliveryMode", value: delivery } });
    if (cursor != null && typeof cursor !== "string") throw new ProtocolError(INVALID_PARAMS, "cursor must be a string or null");
    if (!integer(maxAgeMs, 0)) throw new ProtocolError(INVALID_PARAMS, "maxAgeMs must be a non-negative integer");
    if (!integer(maxEvents, 1)) throw new ProtocolError(INVALID_PARAMS, "maxEvents must be a positive integer");
    const checked = await type.inputSchema["~standard"].validate(args);
    if (checked.issues) throw new ProtocolError(INVALID_PARAMS, `Invalid arguments for ${type.name}: ${checked.issues.map(issue => issue.message).join("; ")}`);
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

  const endSubscription = (type: EventType, id: string, error: EventError) => {
    for (const held of [...type.subscriptions.get(id)?.held ?? []]) held.end(error);
  };

  // Begins holding a subscription, by a stream, a poll lease or another delivery mode: counted against the limits
  // first, so a refused one provisions nothing. The type's onSubscribe is called when the first hold of an id
  // begins, and its teardown when the last ends, so two streams of one subscription set it up once. `end` is how the
  // delivery mode is told the app ended it; `close` is how the mode says its hold is over.
  const open: Internals["open"] = async (type, { id, delivery, arguments: args, context }, end) => {
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
      current.ready.then(teardown => { if (typeof teardown === "function") settle(teardown); }, () => {});
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
  interface Lent { type: EventType; opening?: Promise<Held>; ended?: EventError; release?: () => void; timer?: ReturnType<typeof setTimeout> }
  const leases = new Map<string, Lent>();
  const lease = async (type: EventType, { lease: key, ...subscribed }: Reader & { lease: string }): Promise<Held> => {
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
      const fresh: Lent = { type };
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

  const changed = () => {
    if (!listChanged) return;
    for (const reference of served) {
      const server = reference.deref();
      if (!server) served.delete(reference);
      else if (server.transport) server.notification({ method: "notifications/events/list_changed" } as never).catch(() => {});
    }
  };

  // What a delivery mode works with: `subscription` checks a request, names its event type and the subscription's
  // id, `open` begins holding a subscription, `read` gives a subscription what it is owed after a cursor (`since` and
  // `shape` for emitted events alone), `position` is a type's cursor, a type's `sinks` hear what is emitted, and its
  // `subscriptions` are the ones held by every mode, by id.
  const internals: Internals = { types, subscription, open, read, since, shape, position };

  return {
    [INTERNALS]: internals,
    event<A, D>(name: string, { description, inputSchema, payloadSchema, _meta, match, transform, check, interval: every = interval, delivery = offered, authorize, onSubscribe }: EventDefinition<A, D>): Emitter<D> {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      // A sink is told each event as it is emitted: a push stream is one, and a delivery mode adds its own. The type
      // holds the definition's functions for any arguments and data, which its subscriptions' checks uphold.
      const type: EventType = {
        name, order: ++declared, description, inputSchema: inputSchema as EventSchema<unknown>, payloadSchema, _meta,
        match: match as EventType["match"], transform: transform as EventType["transform"], check: check as EventType["check"],
        interval: every, delivery, authorize: authorize as EventType["authorize"], onSubscribe: onSubscribe as EventType["onSubscribe"],
        sequence: 0, dropped: 0, kept: [], sinks: new Set(), subscriptions: new Map(), owed: new Map(),
      };
      types.set(name, type);
      // A delivery mode hears of each type as it is declared, so it can deliver before any server is served.
      for (const mode of modes) mode.declared?.(type, internals);
      changed();
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscription: target } = {}) {
          const occurrence: Occurrence = { eventId, name, timestamp, data };
          // Data that cannot be sent as JSON is refused here, before anything is kept or sent.
          JSON.stringify(occurrence);
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            // An event for one subscription that has no stream to take it is lost, and the subscription is told of
            // a gap when it next polls or streams. The ids owed one are as many as the events a type keeps.
            if (target !== undefined && ![...type.subscriptions.get(target)?.held ?? []].some(held => held.delivery !== "poll")) {
              type.owed.delete(target);
              type.owed.set(target, true);
              const oldest = type.owed.keys().next();
              if (type.owed.size > keptEvents && !oldest.done) type.owed.delete(oldest.value);
            }
            for (const sink of type.sinks) sink({ target, occurrence });
            return;
          }
          // An event for one subscription is kept like any other, so the subscription has it when it comes back.
          const kept: Stored = { sequence: ++type.sequence, at: Date.now(), target, occurrence };
          type.kept.push(kept);
          for (let first = type.kept[0]; first && (type.kept.length > keptEvents || first.at < kept.at - keptAge); first = type.kept[0]) {
            type.kept.shift();
            type.dropped = first.sequence;
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

    serve(mcp) {
      const given = mcp as McpServer | Server;
      const server = "server" in given ? given.server : given;
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
        const last = page.at(-1);
        return {
          events: page.map(type => ({
            name: type.name,
            ...(type.description && { description: type.description }),
            delivery: type.delivery,
            inputSchema: json(type.inputSchema),
            payloadSchema: json(type.payloadSchema),
            ...(type._meta && { _meta: type._meta }),
          })),
          ...(start + pageSize < all.length && last && { nextCursor: String(last.order) }),
        };
      });
      for (const mode of modes) mode.serve(server, internals);

      server.setRequestHandler("events/poll", { params }, async (request, ctx: ServerContext) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "poll");
        const held = await lease(type, subscribed);
        // Each poll is answered for its own caller, with the lease's id.
        const { events, start, failures, truncated, ...rest } = await read(type, { ...subscribed, id: held.id, untargetable: held.untargetable ?? false }, request.cursor, request);
        const lost = !held.untargetable && type.owed.delete(held.id);
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, truncated: truncated || lost, nextPollMs: type.interval };
      });

      server.setRequestHandler("events/stream", { params }, async (request, ctx: ServerContext) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "push");
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION]: ctx.mcpReq.id };
        let done = false;
        let ending: EventError | undefined;
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
        const notify = async (method: string, body: Record<string, unknown>) => {
          if (signal.aborted) return;
          try {
            await ctx.mcpReq.notify({ method: `notifications/events/${method}`, params: { ...body, _meta: meta } } as never);
          } catch {
            finish();
          }
        };
        // The stream follows its cursor: emitted events wake it, and a type with a check function is asked again
        // every interval. What it is owed waits in the buffer or the source, not here, so a slow client is not owed
        // more memory than one batch; when what it is owed is no longer kept, it is told of the gap.
        let cursor: string | null = request.cursor ?? null;
        let behind = true;
        // What a type with a check function emitted and the stream has yet to send. The check function finds it
        // too, so when too much waits the oldest is let go.
        const pushed: Emitted[] = [];
        const sink = (emitted: Emitted) => {
          if (type.check) {
            pushed.push(emitted);
            if (pushed.length > keptEvents) pushed.shift();
          } else behind = true;
          wake();
        };
        type.sinks.add(sink);
        let beat: ReturnType<typeof setInterval> | undefined;
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
              let result: Owed | undefined;
              try {
                result = await read(type, held, cursor, { maxAgeMs: first ? request.maxAgeMs : undefined });
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
                for (const error of result.failures) await notify("error", { error });
                for (const event of result.events) {
                  if (done) break;
                  await notify("event", { ...event });
                  cursor = event.cursor ?? null;
                }
                if (done) break;
                cursor = result.cursor;
                if (after) await notify("active", { cursor, truncated: true });
                if (result.hasMore) {
                  due = 0;
                  behind = true;
                }
              }
            }
            // What a type with a check function emits is sent at once, at the cursor the stream has reached.
            for (let emitted = pushed.shift(); emitted && !done; emitted = pushed.shift()) {
              let failure: EventError | undefined;
              const event = shape(type, emitted, held, error => { failure = error; });
              if (failure) await notify("error", { error: failure });
              if (event) await notify("event", { ...event, cursor });
            }
            if (done) break;
            let timer: ReturnType<typeof setTimeout> | undefined;
            await new Promise<void>(resolve => {
              wake = resolve;
              if (done || pushed.length || (!type.check && behind)) resolve();
              else if (type.check) timer = setTimeout(resolve, Math.max(0, due - Date.now()));
            });
            clearTimeout(timer);
            wake = () => {};
          }
          // Set by the end callback while the stream ran, which the narrowing above does not see.
          const ended = ending as EventError | undefined;
          if (ended) {
            if (first) throw refusal(ended);
            await notify("terminated", { error: ended });
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

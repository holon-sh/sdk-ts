// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// The draft is experimental, so this lives under ext and may change with it.
// It serves the poll and push delivery modes, and webhook delivery when given a webhookTtl, from a module of its own
// that reaches the event types through the internals below. Names follow the sketch, and types are the MCP SDK's own
// wherever it has them.
import { ProtocolError, ProtocolErrorCode, SUBSCRIPTION_ID_META_KEY } from "@modelcontextprotocol/server";
import type { AuthInfo, JSONRPCErrorResponse, McpServer, Server, StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { webhooks, type WebhookOptions } from "./webhooks.js";

export type { WebhookOptions } from "./webhooks.js";

/** The request a subscription came in, as Holon admitted it: read its caller with getContext. */
export type SubscriptionContext = { authInfo?: AuthInfo | undefined } | undefined;
/** How a subscription receives its events. */
export type DeliveryModeName = "poll" | "push" | (string & {});
/** A JSON-RPC error, as a subscription that is terminated or fails is told it. */
export type EventError = JSONRPCErrorResponse["error"];
/** A subscription as it begins: who asked, for what, and by which delivery mode. */
export interface Subscription<A> {
  /**
   * The sketch's subscription_id: names the subscription to `emit` and `terminate`. For a caller with an identity it
   * is the same for the same caller, event type and arguments, so it survives a reconnect and a poll lease that lapses. The caller is the user, the
   * client acting for them, the agent acting for the user and the token's scopes, as Holon admitted them; two streams
   * with the same id both receive what is emitted to it. A caller without a subject has no identity: each of its
   * streams has an id of its own, which ends with the stream, and its polls share one lease per arguments with every
   * such caller, to which nothing is emitted alone.
   */
  readonly subscriptionId: string;
  readonly name: string;
  readonly delivery: DeliveryModeName;
  readonly arguments: A;
  readonly context: SubscriptionContext;
}
/** An occurrence as subscriptions receive it: the sketch's EventOccurrence. `cursor` is the position after it. */
export interface EventOccurrence<D = unknown> {
  eventId: string;
  name: string;
  /** When it happened, in ISO 8601. */
  timestamp: string;
  data: D;
  cursor?: string | null;
  _meta?: Record<string, unknown>;
}
/**
 * What happened after a cursor, as a check function finds it: the sketch's EventResult. Each event is an
 * EventOccurrence whose name is the type's, and whose `eventId` (the source's own, so a client drops one it has seen)
 * and `timestamp` are made up when not given. An event's `cursor`, the position just after it, lets a batch be cut
 * short; without it a batch is delivered whole.
 */
export interface EventResult<D> {
  /**
   * Empty when the cursor was null: a null cursor asks only for the current position. A source without positions
   * answers with a null cursor, is asked with null each time, and answers each time with what is new.
   */
  events: Array<Omit<EventOccurrence<D>, "name" | "eventId" | "timestamp" | "cursor"> & { eventId?: string; timestamp?: string; cursor?: string }>;
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
  inputSchema: StandardSchemaWithJSON<unknown, A>;
  /** The data of each occurrence, as subscriptions receive it. */
  payloadSchema: StandardSchemaWithJSON;
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
   * it every second. The cursor is the source's own, so it outlives the process. A null cursor asks for the
   * current position. The function filters and shapes for the arguments itself; `match` and `transform` apply only to
   * what is emitted. Without it, emitted events are kept in memory and polls and streams are served from there.
   */
  check?: (cursor: string | null, args: A, context: SubscriptionContext) => EventResult<D> | Promise<EventResult<D>>;
  /** The delivery modes this event type offers. Every mode served unless given, except webhook for a type with a check function, which webhook delivery does not read. */
  delivery?: DeliveryModeName[];
  /**
   * Whether the caller may subscribe with these arguments. A subscription is refused with Forbidden when it may not,
   * and one already open is ended when it no longer may: each poll asks, and a stream asks at each heartbeat. A
   * refused poll ends its lease at once.
   */
  authorize?: (args: A, context: SubscriptionContext) => boolean | Promise<boolean>;
  /**
   * The sketch's on_subscribe: called when a subscription begins, to set up what its events come from. A
   * subscription held by two streams at once is set up once. A server that restarts calls it again on the next poll
   * or stream, with the same id. A subscription refused by the limits never reaches it.
   */
  onSubscribe?: (subscription: Subscription<A>) => void | Promise<void>;
  /**
   * The sketch's on_unsubscribe: called when a subscription that `onSubscribe` set up ends: its last push stream
   * closes, its poll lease lapses because polls stopped, or the app terminates it.
   */
  onUnsubscribe?: (subscription: Subscription<A>) => void | Promise<void>;
}
/** Emits occurrences of one event type to the subscriptions they match, and ends its subscriptions. */
export interface Emitter<D> {
  /**
   * `eventId` lets a client drop an occurrence it has seen. Give the source's own id when it has one. With
   * `subscriptionId`, the sketch's targeted emit, the occurrence goes to that subscription alone, whatever its arguments; it is kept like any
   * other, so a subscription that reconnects or polls again from its cursor still has it, or is told of a gap. An
   * event type with a check function pushes what it emits to open streams at once and does not keep it: polls and
   * reconnecting streams learn of it from the check function, and one emitted to a subscription that does not get it
   * on a stream is lost, so that subscription's next poll or stream is told of a gap.
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
  emit(data: D, options?: { eventId?: string; timestamp?: string; subscriptionId?: string }): void;
  /**
   * The position after the last occurrence emitted, for a type without a check function. Return it with the state
   * a tool reads, in the same synchronous run, and a client that subscribes from it hears every change after that
   * state and none before. A type with a check function has no such position here: its cursor is the source's own,
   * so read the source's head instead. This throws for such a type.
   */
  cursor(): string;
  /**
   * Terminates one subscription, or all of this type's: a stream is sent `notifications/events/terminated` with
   * `error` and closed, and the next poll is answered with it. Forbidden unless given.
   */
  terminate(subscriptionId?: string, error?: EventError): void;
  /**
   * Stops offering this event type: its subscriptions end with NotFound.
   */
  remove(): void;
}
export interface EventsOptions {
  /**
   * The sketch's webhook_ttl, which turns webhook delivery on: the longest lifetime granted to a webhook
   * subscription, in milliseconds. A client's suggestion is held to it, and every grant expires. Without it, webhook
   * delivery is not offered.
   */
  webhookTtl?: number;
  /** For tests of webhook delivery. */
  webhook?: WebhookOptions;
}
/** A delivery mode besides poll and push: webhook. It registers its requests on each server and is listed by events/list. Not for applications. */
export interface DeliveryMode {
  readonly name: string;
  serve(server: object, internals: Internals): void;
}
/** The event types of a process, served by each MCP server it creates. */
export interface Events {
  /** Declares an event type. Emit its occurrences with the returned emitter. */
  event<A, D>(name: string, definition: EventDefinition<A, D>): Emitter<D>;
  /** Serves events/list, events/poll and events/stream on an McpServer or a Server, and declares the extension. */
  serve(server: McpServer | Server): void;
  /** What a delivery mode works with. Not for applications. */
  readonly [INTERNALS]: Internals;
}

/** An emitted event: kept, at a sequence, for a type without a check function; pushed only, for one with. */
export interface Kept { sequence?: number; at?: number; target?: string | undefined; occurrence: EventOccurrence; /** Its length as JSON. */ size?: number }
/** What a subscription is owed after a cursor. */
export interface Owed {
  events: EventOccurrence[];
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
  /** Whether the caller may hold the subscription, which a mode that holds subscriptions long asks again. */
  authorize?(args: unknown, context: SubscriptionContext): boolean | Promise<boolean>;
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
  readonly shape: (type: EventTypeState, kept: Kept, subscription: Pick<Held, "id" | "arguments" | "context" | "untargetable">, failed?: (error: EventError) => void) => EventOccurrence | undefined;
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
  http?: SubscriptionContext & { req?: Request | undefined };
}
/** What a stream has handed to its transport and its reader has not taken, as the process's budget charges it. */
interface Backlog { bytes: number; measure(): void }
interface Type<A = any, D = any> extends EventTypeState {
  readonly order: number;
  readonly description?: string | undefined;
  readonly inputSchema: StandardSchemaWithJSON<unknown, A>;
  readonly payloadSchema: StandardSchemaWithJSON;
  readonly _meta?: Record<string, unknown> | undefined;
  readonly match?: EventDefinition<A, D>["match"];
  readonly transform?: EventDefinition<A, D>["transform"];
  readonly authorize?: EventDefinition<A, D>["authorize"];
  readonly onSubscribe?: EventDefinition<A, D>["onSubscribe"];
  readonly onUnsubscribe?: EventDefinition<A, D>["onUnsubscribe"];
  sequence: number;
  dropped: number;
  kept: Array<Kept & { sequence: number; at: number }>;
  /** Subscriptions owed word of a gap, for events emitted to them alone that they could not be given. */
  owed: Map<string, true>;
}
interface Lease { type: Type; opening?: Promise<Held>; ended?: EventError; release?: () => void; timer?: ReturnType<typeof setTimeout> }

const INVALID_PARAMS = ProtocolErrorCode.InvalidParams;
const INTERNAL_ERROR = ProtocolErrorCode.InternalError;
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
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = (run: () => unknown) => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value: unknown, minimum: number) => value === undefined || Number.isInteger(value) && (value as number) >= minimum;
const encoder = new TextEncoder();
const bytes = (value: unknown) => encoder.encode(JSON.stringify(value)).byteLength;
// Over HTTP the MCP SDK queues what a stream sends on the response without waiting for its reader, and has no public
// way to say how much waits. This finds the response's queue in the private fields of its HTTP transports: the
// per-request one, and the one it serves 2025 clients with, bare or wrapped for Node. Its desiredSize falls by one for
// each frame waiting, and is checked to be a number each time it is read. Where the queue is not found, as after an
// SDK release that renames these fields, a stream counts everything it hands over instead.
type Queue = { readonly desiredSize: unknown };
const queueOf = (transport: any, requestId: unknown): Queue | undefined => {
  try {
    const inner = transport?._webStandardTransport ?? transport;
    const controller = inner?._sse?.controller ?? inner?._streamMapping?.get?.(inner._requestToStreamMapping?.get?.(requestId))?.controller;
    return controller && typeof controller === "object" && "desiredSize" in controller ? controller : undefined;
  } catch {
    return undefined;
  }
};

// What each type without a check function keeps of what it emits, for polls and reconnecting streams: the sketch's
// emit buffer.
const KEPT_EVENTS = 10_000;
const KEPT_AGE = 10 * 60_000;
// How long a poll is told to wait before the next, and how often a stream asks a check function.
const INTERVAL = 1000;
// How often a stream hears from the server when nothing happens, as the sketch recommends.
const HEARTBEAT = 30_000;
// How long a poll subscription lasts after its last poll: the sketch's poll subscription TTL.
const POLL_SUBSCRIPTION_TTL = 60_000;
// How many subscriptions may be held at once, by every delivery mode, and by one caller. Callers without an identity
// cannot be told apart, so they count together as one caller.
const MAX_SUBSCRIPTIONS = 10_000;
const MAX_SUBSCRIPTIONS_PER_CALLER = 1000;
// How many event types events/list returns at a time.
const PAGE_SIZE = 100;
// How many bytes one stream may have handed to its transport that its reader has not taken, and every stream of the
// process together. Past the first the stream ends with its result, and its client reconnects from its cursor; past
// the second, streams with an event waiting end the same way; a new stream is refused with ResourceExhausted unless
// the process has room for its budget.
const STREAM_BACKLOG = 2 ** 20;
const BACKLOG = 16 * 2 ** 20;
// How long a stream whose waiting frames cannot be seen stays charged after it ends, when nothing says its
// connection closed.
const LINGER = 10 * HEARTBEAT;

/**
 * Event types a process emits and the MCP servers it creates serve, in the poll and push delivery modes of MCP Events,
 * the draft extension of the Triggers & Events Working Group. Each type keeps the last ten thousand events it emits,
 * for ten minutes, for polls and for streams that reconnect: those cursors last as long as the process, and after a
 * restart a client is told that events were skipped. A type with a check function uses its source's cursors instead,
 * which outlive the process. A type is asked again, and a poll told to come back, every second. A stream hears from
 * the server every thirty seconds.
 *
 * A stream whose reader stops taking what it is sent holds at most 1 MiB of it, and the process's streams 16 MiB
 * together, counting ended streams until their readers take what was left or their connections close. A stream past
 * either ends with its result, and its client reconnects from its cursor, so nothing is lost that is still kept; a
 * stream opened while the process's budget is spent is refused with ResourceExhausted. Over HTTP the MCP SDK queues a
 * stream's frames without waiting for its reader, and its queue is found in private fields of its transports, checked
 * each time; where it cannot be found, a stream counts everything it hands over as waiting, so it is ended after 1 MiB
 * and its charge is released when its connection closes, or five minutes after it ends when nothing says so.
 */
export function createEvents({ webhookTtl, webhook }: EventsOptions = {}): Events {
  const modes = webhookTtl === undefined ? [] : [webhooks({ ...webhook, ttl: webhookTtl, heartbeat: HEARTBEAT })];
  const offered = ["poll", "push", ...modes.map(mode => mode.name)];
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map<string, Type>();
  let declared = 0;
  let subscribed = 0;
  const callers = new Map<string, number>();

  const position = (type: EventTypeState, sequence: number = (type as Type).sequence) => `${epoch}.${sequence}`;

  // An event emitted to one subscription that it could not be given is owed to it as a gap, on its next poll or
  // stream. The ids owed one are as many as the events a type keeps.
  const owe = (type: Type, id: string) => {
    type.owed.delete(id);
    type.owed.set(id, true);
    if (type.owed.size > KEPT_EVENTS) type.owed.delete(type.owed.keys().next().value!);
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
    const events: EventOccurrence[] = [];
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
    const events: EventOccurrence[] = [];
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
    console.error(`holon-sh/ext/events: event ${eventId} of ${type.name} was skipped for a subscription:`, error);
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
  // begins, and its onUnsubscribe when the last ends, so two streams of one subscription set it up once. `end` is how
  // the delivery mode is told the app terminated it; `close` is how the mode says its hold is over.
  const open: Internals["open"] = async (state, { id, delivery, arguments: args, context }, end) => {
    const type = state as Type;
    if (types.get(type.name) !== type) throw refusal(removed);
    // Callers without an identity cannot be told apart, so they count together as one.
    const who = caller(context) ?? "anonymous";
    if (subscribed >= MAX_SUBSCRIPTIONS) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: MAX_SUBSCRIPTIONS } });
    if ((callers.get(who) ?? 0) >= MAX_SUBSCRIPTIONS_PER_CALLER) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptionsPerCaller", max: MAX_SUBSCRIPTIONS_PER_CALLER } });
    subscribed++;
    callers.set(who, (callers.get(who) ?? 0) + 1);
    let entry = type.subscriptions.get(id);
    if (!entry) {
      const subscription = { subscriptionId: id, name: type.name, delivery, arguments: args, context };
      const ready = Promise.resolve().then(() => type.onSubscribe?.(subscription)).then(() => subscription);
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
      // Only a subscription that was set up is told it ended.
      current.ready.then(subscription => { if (type.onUnsubscribe) settle(() => type.onUnsubscribe!(subscription as Subscription<unknown>)); }, () => {});
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
  // when polls stop for a minute, many of the intervals the poll was told to wait.
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
    }, POLL_SUBSCRIPTION_TTL);
    current.timer.unref?.();
    return held;
  };

  // What every stream has handed to its transport and its reader has not taken, open or ended: each is charged to
  // the process until its reader takes it or its connection closes. A stream measures its own as it sends; the rest
  // are measured again when a stream is opened while the budget looks spent, and at most every tenth of a second
  // while a stream finds it spent.
  const backlogs = new Set<Backlog>();
  let backlogged = 0;
  let measured = 0;
  const remeasure = (now = false) => {
    if (!now && Date.now() - measured < 100) return;
    measured = Date.now();
    for (const each of backlogs) each.measure();
  };
  // A stream's backlog: `hand` counts a frame once it is handed over, `room` says whether an event may follow it, and
  // `end` says the stream is over, after which what waits stays charged until it is taken. Where the queue cannot be
  // seen, everything handed over counts as waiting, until the connection closes or, when nothing says so, LINGER
  // after the stream ends. Over stdio the transport waits for the reader, so nothing is charged.
  const backlog = (transport: unknown, requestId: unknown, req: Request | undefined) => {
    let queue: Queue | undefined;
    // The frames handed over and perhaps not taken, from `head`, newest last: their bytes and how many are events.
    const frames: Array<{ size: number; event: boolean }> = [];
    let head = 0;
    let waiting = 0;
    let events = 0;
    // Everything handed over, for a queue that cannot be seen.
    let handed = 0;
    let handedEvents = 0;
    let ended = false;
    let until = Infinity;
    const seen = () => typeof queue?.desiredSize === "number";
    const self: Backlog = {
      bytes: 0,
      measure() {
        const size = queue?.desiredSize;
        let charge: number;
        // A queue that errored holds nothing.
        if (size === null) charge = 0;
        else if (typeof size === "number") {
          // The queue reports itself full with one frame in it. Once the stream has ended, one frame left is its
          // result, which reads the same as a queue the reader emptied or the connection cancelled.
          let count = Math.max(0, 1 - size);
          if (ended && count <= 1) count = 0;
          // What waits is the newest of what this stream handed over; the transport's own keep-alives are small.
          while (frames.length - head > count) {
            const frame = frames[head++]!;
            waiting -= frame.size;
            if (frame.event) events--;
          }
          if (head > 64 && head * 2 > frames.length) {
            frames.splice(0, head);
            head = 0;
          }
          charge = waiting;
        } else charge = !req || ended && (req.signal.aborted || Date.now() > until) ? 0 : handed;
        backlogged += charge - self.bytes;
        self.bytes = charge;
        if (ended && !charge) backlogs.delete(self);
      },
    };
    backlogs.add(self);
    return {
      hand(size: number, event: boolean) {
        frames.push({ size, event });
        waiting += size;
        handed += size;
        if (event) {
          events++;
          handedEvents++;
        }
        // The per-request transport makes its queue when the first frame is written.
        queue ??= queueOf(transport, requestId);
        self.measure();
      },
      // An event goes when it fits the stream's budget and the process's, and alone, whatever it weighs, when no
      // other event waits. Under the process's budget, too, only a stream with an event waiting is stopped.
      room(size: number) {
        self.measure();
        if (!self.bytes || !(seen() ? events : handedEvents)) return true;
        if (self.bytes + size > STREAM_BACKLOG) return false;
        if (backlogged + size > BACKLOG) remeasure();
        return backlogged + size <= BACKLOG;
      },
      end() {
        ended = true;
        until = Date.now() + LINGER;
        self.measure();
      },
    };
  };
  const exhausted = (): EventError => ({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "backlog", max: BACKLOG } });

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
    event<A, D>(name: string, { description, inputSchema, payloadSchema, _meta, match, transform, check, delivery = offered.filter(mode => !check || mode !== "webhook"), authorize, onSubscribe, onUnsubscribe }: EventDefinition<A, D>): Emitter<D> {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !offered.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${offered.join(", ")} are served.`);
      // Webhook delivery sends what is emitted, and does not ask a check function.
      if (check && delivery.includes("webhook")) throw new Error(`Event ${name} has a check function, which webhook delivery does not read.`);
      const type: Type<A, D> = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, match, transform, check: check as Type["check"], interval: INTERVAL, delivery, authorize, onSubscribe, onUnsubscribe,
        sequence: 0, dropped: 0, kept: [], sinks: new Set(), subscriptions: new Map(), owed: new Map(),
      };
      types.set(name, type);
      return {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscriptionId: target } = {}) {
          const occurrence = { eventId, name, timestamp, data };
          // Data that cannot be sent as JSON is refused here, before anything is kept or sent.
          const size = JSON.stringify(occurrence).length;
          // A type with a check function is asked for what polls are owed, so what it emits is pushed and not kept.
          if (type.check) {
            // An event for one subscription that has no stream to take it is lost.
            if (target !== undefined && ![...type.subscriptions.get(target)?.held ?? []].some(held => held.delivery !== "poll")) owe(type, target);
            for (const sink of type.sinks) sink({ target, occurrence, size });
            return;
          }
          // An event for one subscription is kept like any other, so the subscription has it when it comes back.
          const kept = { sequence: ++type.sequence, at: Date.now(), target, occurrence };
          type.kept.push(kept);
          while (type.kept.length > KEPT_EVENTS || type.kept[0]!.at < kept.at - KEPT_AGE) type.dropped = type.kept.shift()!.sequence;
          for (const sink of type.sinks) sink(kept);
        },
        cursor() {
          if (type.check) throw new Error(`Event ${name} has a check function, whose cursor is its source's own.`);
          return position(type);
        },
        terminate(id, error = forbidden) {
          if (id !== undefined) return endSubscription(type, id, error);
          for (const each of [...type.subscriptions.keys()]) endSubscription(type, each, error);
        },
        remove() {
          if (types.get(name) !== type) return;
          types.delete(name);
          for (const each of [...type.subscriptions.keys()]) endSubscription(type, each, removed);
        },
      };
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      const underlying: Server = "server" in mcp ? mcp.server : mcp;
      // The custom methods are registered through the parts of the server this module uses.
      const server = underlying as unknown as Served;
      // The sketch declares capabilities.events. The MCP SDK's client drops top-level capabilities it does not know,
      // so the extension is declared under capabilities.extensions too, where SDK clients read it.
      // Clients are never told the event types changed: over Holon's stateless HTTP, the notification reaches none.
      server.registerCapabilities({ events: { listChanged: false }, extensions: { [EVENTS_EXTENSION]: { listChanged: false } } });
      const json = (schema: StandardSchemaWithJSON) => schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
      server.setRequestHandler("events/list", { params }, request => {
        const all = [...types.values()];
        let start = 0;
        if (request.cursor != null) {
          const after = Number(request.cursor);
          if (typeof request.cursor !== "string" || !Number.isInteger(after)) throw new ProtocolError(INVALID_PARAMS, "Invalid cursor for events/list");
          start = all.findIndex(type => type.order > after);
          if (start < 0) start = all.length;
        }
        const page = all.slice(start, start + PAGE_SIZE);
        return {
          events: page.map(type => ({
            name: type.name,
            ...(type.description && { description: type.description }),
            delivery: type.delivery,
            inputSchema: json(type.inputSchema),
            payloadSchema: json(type.payloadSchema),
            ...(type._meta && { _meta: type._meta }),
          })),
          ...(start + PAGE_SIZE < all.length && { nextCursor: String(page.at(-1)!.order) }),
        };
      });
      for (const mode of modes) mode.serve(underlying, internals);

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
        // A new stream needs room for its own budget. What ended streams left unread may have been taken since they
        // were last measured.
        if (backlogged + STREAM_BACKLOG > BACKLOG) remeasure(true);
        if (backlogged + STREAM_BACKLOG > BACKLOG) throw refusal(exhausted());
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION_ID_META_KEY]: ctx.mcpReq.id };
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
        // A reader that stops taking what the stream sends holds it in memory, up to the stream's budget and the
        // process's. Past them the stream ends with its result, before the event that did not fit, and its client
        // reconnects from its cursor: what it missed comes from what is kept, or is told as a gap.
        const queued = backlog((underlying as { transport?: unknown }).transport, ctx.mcpReq.id, ctx.http?.req);
        // A stream that cannot be written to is over. An event that does not fit ends it, and is not sent.
        const notify = async (method: string, body: object) => {
          if (signal.aborted) return false;
          const params = { ...body, _meta: meta };
          const size = bytes(params);
          const event = method === "event";
          if (event && !queued.room(size)) {
            finish();
            return false;
          }
          try {
            await ctx.mcpReq.notify({ method: `notifications/events/${method}`, params });
          } catch {
            finish();
            return false;
          }
          queued.hand(size, event);
          return true;
        };
        // The stream follows its cursor: emitted events wake it, and a type with a check function is asked again
        // every interval. What it is owed waits in the buffer or the source, not here, so a slow client is not owed
        // more memory than one batch; when what it is owed is no longer kept, it is told of the gap.
        let cursor: string | null = request.cursor ?? null;
        let behind = true;
        // What a type with a check function emitted and the stream has yet to send, which waits only where sending
        // waits for the reader, as over stdio. The check function finds it too, so when more than the stream's budget
        // waits the stream ends, and its client reconnects from its cursor.
        const pushed: Kept[] = [];
        let pushedSize = 0;
        const sink = (kept: Kept) => {
          if (type.check) {
            pushed.push(kept);
            pushedSize += kept.size ?? 0;
            if (pushedSize > STREAM_BACKLOG) finish();
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
        }, HEARTBEAT);
        let first = true;
        try {
          let due = 0;
          while (!done) {
            if (type.check ? Date.now() >= due : behind) {
              behind = false;
              let result: Owed | undefined;
              try {
                result = await read(type, held, cursor, { ...(first && request.maxAgeMs !== undefined && { maxAgeMs: request.maxAgeMs }) });
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
                for (const event of result.events) {
                  if (done || !(await notify("event", event))) break;
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
            while (pushed.length && !done) {
              const kept = pushed[0]!;
              let failure: EventError | undefined;
              const event = shape(type, kept, held, error => { failure = error; });
              if (failure) await notify("error", { error: failure });
              if (event && !(await notify("event", { ...event, cursor }))) break;
              pushed.shift();
              pushedSize -= kept.size ?? 0;
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
          if (ending) {
            if (first) throw refusal(ending);
            await notify("terminated", { error: ending });
          }
        } finally {
          clearInterval(beat);
          queued.end();
          type.sinks.delete(sink);
          // What was emitted to this subscription alone and not sent is owed to it as a gap when it comes back.
          if (held.id === subscribed.lease && pushed.some(kept => kept.target === held.id)) owe(type, held.id);
          held.close();
        }
        // The final frame, sent when the server ends the stream; when the client did, nobody is listening.
        return { _meta: {} };
      });
    },
  };
}

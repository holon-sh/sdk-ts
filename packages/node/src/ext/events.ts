// The server side of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
// The draft is experimental, so this lives under ext and may change with it. It serves the poll and push delivery
// modes. Names follow the sketch, and types are the MCP SDK's own wherever it has them.
import { ProtocolError, ProtocolErrorCode, SUBSCRIPTION_ID_META_KEY } from "@modelcontextprotocol/server";
import type { AuthInfo, JSONRPCErrorResponse, McpServer, Server, StandardSchemaWithJSON } from "@modelcontextprotocol/server";

/** The request a subscription came in, as Holon admitted it: read its caller with getContext. */
export type SubscriptionContext = { authInfo?: AuthInfo | undefined } | undefined;
/** How a subscription receives its events. */
export type DeliveryModeName = "poll" | "push";
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
  cursor?: string;
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
  /** The delivery modes this event type offers: poll and push unless given. */
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
export interface Emitter<D, A = unknown> {
  /**
   * `eventId` lets a client drop an occurrence it has seen. Give the source's own id when it has one. With
   * `subscriptionId`, the sketch's targeted emit, the occurrence goes to that subscription alone, whatever its
   * arguments; it is kept like any other, so a subscription that reconnects or polls again from its cursor still has
   * it, or is told of a gap.
   *
   * Emitting is synchronous. Occurrences emitted one after another in the same synchronous run reach each
   * subscription in that order, with no other occurrence of this type between them, whether polled or pushed. So a
   * group of changes that nothing may come between is either emitted in one run or sent as one occurrence holding a
   * list. A subscription skips part of a group only when it is told of a gap: the group outgrew the events kept, or
   * the subscription fell behind them.
   *
   * The data is serialised when it is emitted, so data that cannot be sent as JSON throws here, before anything is
   * kept or sent.
   */
  emit(data: D, options?: { eventId?: string; timestamp?: string; subscriptionId?: string }): void;
  /**
   * The position after the last occurrence emitted. Return it with the state a tool reads, in the same synchronous
   * run, and a client that subscribes from it hears every change after that state and none before.
   */
  cursor(): string;
  /**
   * Terminates one subscription, or all of this type's: a stream is sent what was emitted to it before, then
   * `notifications/events/terminated` with `error`, and closed. The next poll is answered with the error. Forbidden
   * unless given, which ends delivery at once, since access is lost.
   */
  terminate(subscriptionId?: string, error?: EventError): void;
  /**
   * Stops offering this event type: its subscriptions end with NotFound.
   */
  remove(): void;
  /**
   * Keeps a value for each subscriber, such as its status, for as long as it subscribes. A subscriber is named by its
   * subscription's arguments, so give each one its own, such as an id its client makes: subscriptions with the same
   * arguments, such as one client's overlapping streams, are one subscriber. `told` makes the data emitted when a
   * value is set, and, given none, when it leaves.
   */
  presence<V>(told: (args: A, value: V | undefined) => D): Presence<A, V>;
}
/** Each subscriber's value, kept while it subscribes. */
export interface Presence<A, V> {
  /**
   * Sets the value of the subscriber these arguments name, and emits it. It stays while a subscription with these
   * arguments is open, by either delivery mode, and leaves `linger` milliseconds after the last one ends or after it is
   * last set, whichever is later. So a subscriber that reconnects within the linger keeps it, and a caller that cannot
   * subscribe keeps it by setting it again.
   */
  set(args: A, value: V, linger: number): void;
  /** The values a subscription with these arguments is shown: those whose data `match` lets it receive, asked with no context. */
  seen(args: A): V[];
}
/** The event types of a process, served by each MCP server it creates. */
export interface Events {
  /** Declares an event type. Emit its occurrences with the returned emitter. */
  event<A, D>(name: string, definition: EventDefinition<A, D>): Emitter<D, A>;
  /** Serves events/list, events/poll and events/stream on an McpServer or a Server, and declares the extension. */
  serve(server: McpServer | Server): void;
}

/** The identifier a server declares the Events extension under, in capabilities.extensions. */
export const EVENTS_EXTENSION = "io.modelcontextprotocol/events";

// The parts of an MCP server and of a request's context this module uses.
interface Served {
  registerCapabilities(capabilities: object): void;
  setRequestHandler(method: string, schemas: object, handler: (request: any, ctx: Context) => unknown): void;
}
interface Context {
  mcpReq: { id: string | number; signal: AbortSignal; notify(notification: { method: string; params: object }): Promise<void> };
  http?: SubscriptionContext & object;
}
/** An emitted event, kept at its sequence for polls and reconnecting streams. */
interface Kept { sequence: number; at: number; target: string | undefined; occurrence: EventOccurrence }
/** A subscription held by a push stream or a poll lease. */
interface Held {
  readonly id: string;
  readonly arguments: unknown;
  readonly context: SubscriptionContext;
  /** Nothing is emitted to it alone: a poll lease shared by callers without an identity. */
  untargetable?: boolean;
  /** Called when the app ends the subscription. */
  readonly end: (error: EventError) => void;
  /** Says the hold is over. */
  close(): void;
}
/** Who an emitted event is shaped for. */
type Reader = Pick<Held, "id" | "arguments" | "context" | "untargetable">;
/** The subscription a request asks for, checked. */
interface Requested { id: string; lease: string; arguments: unknown; context: SubscriptionContext }
interface Type<A = any, D = any> {
  readonly name: string;
  readonly order: number;
  readonly description?: string | undefined;
  readonly inputSchema: StandardSchemaWithJSON<unknown, A>;
  readonly payloadSchema: StandardSchemaWithJSON;
  readonly _meta?: Record<string, unknown> | undefined;
  readonly delivery: DeliveryModeName[];
  readonly match?: EventDefinition<A, D>["match"];
  readonly transform?: EventDefinition<A, D>["transform"];
  readonly authorize?: EventDefinition<A, D>["authorize"];
  readonly onSubscribe?: EventDefinition<A, D>["onSubscribe"];
  readonly onUnsubscribe?: EventDefinition<A, D>["onUnsubscribe"];
  sequence: number;
  dropped: number;
  kept: Kept[];
  /** Woken by each emitted event: one for each push stream. */
  readonly sinks: Set<() => void>;
  /** The subscriptions held by streams and poll leases, by id. */
  readonly subscriptions: Map<string, { held: Set<Held>; ready: Promise<Subscription<A>> }>;
  /** How many streams and poll leases are open, by the subscriber their arguments name. */
  readonly holds: Map<string, number>;
  /** Told when a subscriber's holds change: one for each presence. */
  readonly present: Set<(subscriber: string) => void>;
}
interface Lease { type: Type; opening: Promise<Held>; ended?: EventError; release?: () => void; timer?: ReturnType<typeof setTimeout> }

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
// leases. It is made with the global crypto, which needs no node:crypto at load.
const identify = async (who: string | null, name: string, args: unknown) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([who, name, canonical(args)])));
  return `sub_${hex(new Uint8Array(digest, 0, 16))}`;
};
// A caller without an identity gets an id of its own for each stream.
const unique = () => `sub_${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
// The subscriber a subscription's arguments name, whoever the caller.
const named = (args: unknown) => JSON.stringify(canonical(args));
// Counts up or down under a key, and forgets a key that reaches none.
const count = (counts: Map<string, number>, key: string, by: number) => {
  const total = (counts.get(key) ?? 0) + by;
  if (total) counts.set(key, total);
  else counts.delete(key);
};
// A teardown that fails has nobody to tell, and must not take the process down.
const settle = (run: () => unknown) => { Promise.resolve().then(run).catch(() => {}); };
const integer = (value: unknown, minimum: number) => value === undefined || Number.isInteger(value) && (value as number) >= minimum;

const OFFERED: DeliveryModeName[] = ["poll", "push"];
// What each type keeps of what it emits, for polls and reconnecting streams: the sketch's emit buffer.
const KEPT_EVENTS = 10_000;
const KEPT_AGE = 10 * 60_000;
// How long a poll is told to wait before the next.
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
/**
 * What a stream sends before it ends and its client resumes from its cursor. The draft leaves flow control to the
 * transport, but the MCP SDK's HTTP transport queues whatever a stream sends without waiting for its reader:
 * https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#note-on-flow-control
 */
const STREAM_BUDGET = 2 ** 20;

/**
 * Event types a process emits and the MCP servers it creates serve, in the poll and push delivery modes of MCP Events,
 * the draft extension of the Triggers & Events Working Group. Each type keeps the last ten thousand events it emits,
 * for ten minutes, for polls and for streams that reconnect: those cursors last as long as the process, and after a
 * restart a client is told that events were skipped. A poll is told to come back every second, and a stream hears
 * from the server every thirty seconds.
 */
export function createEvents(): Events {
  // Cursors are positions in this process's memory. One from another process names nothing here. The name is made
  // without node:crypto, which is not there when a server is evaluated for its contract.
  const epoch = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const types = new Map<string, Type>();
  let declared = 0;
  let subscribed = 0;
  const callers = new Map<string, number>();

  const position = (type: Type, sequence = type.sequence) => `${epoch}.${sequence}`;

  // What a subscription is owed after a cursor, up to `until`: the events for it, in order, where delivery starts,
  // and where it now stands. A null cursor starts where the subscription was opened, and so does one from another
  // process, which says that events were skipped. One past the events still kept starts from the oldest kept, and
  // says so too.
  const since = (type: Type, subscription: Reader, cursor: string | null | undefined, { maxAgeMs, maxEvents: limit = Infinity, opened = type.sequence, until = type.sequence }: { maxAgeMs?: number; maxEvents?: number; opened?: number; until?: number } = {}) => {
    const [process, text] = cursor?.split(".") ?? [];
    const resumed = cursor != null && process === epoch && Number.isInteger(Number(text)) && Number(text) <= type.sequence;
    const sequence = resumed ? Number(text) : opened;
    const floor = maxAgeMs === undefined || !resumed ? -Infinity : Date.now() - maxAgeMs;
    const later = type.kept.filter(kept => kept.sequence > sequence && kept.sequence <= until);
    const recent = later.filter(kept => kept.at >= floor);
    const truncated = cursor != null && !resumed || sequence < type.dropped || recent.length < later.length;
    const events: EventOccurrence[] = [];
    const failures: EventError[] = [];
    let reached = recent.length ? recent[0]!.sequence - 1 : until;
    const start = position(type, reached);
    for (const kept of recent) {
      if (events.length === limit) return { events, failures, start, cursor: position(type, reached), truncated, hasMore: true };
      reached = kept.sequence;
      const event = shape(type, kept, subscription, error => failures.push(error));
      if (event) events.push(event);
    }
    return { events, failures, start, cursor: position(type, until), truncated, hasMore: false };
  };

  // The occurrence a subscription receives, or nothing when it is not for it. An event emitted to one subscription
  // is for that one alone, and its arguments are not asked.
  // An event that cannot be shaped for a subscription, because `match` or `transform` throws or what `transform`
  // returns cannot be sent as JSON, is skipped for that subscription alone, so its cursor moves past it. It is
  // logged, and `failed` hears of it so a stream can say so once.
  const shape = (type: Type, { sequence, target, occurrence }: Kept, { id, untargetable, arguments: args, context }: Reader, failed: (error: EventError) => void): EventOccurrence | undefined => {
    let data: unknown;
    try {
      if (target !== undefined ? untargetable || target !== id : type.match && !type.match(occurrence.data, args, context)) return undefined;
      data = type.transform ? type.transform(occurrence.data, args, context) : occurrence.data;
      if (type.transform) JSON.stringify(data);
    } catch (error: any) {
      const { eventId } = occurrence;
      console.error(`holon-sh/ext/events: event ${eventId} of ${type.name} was skipped for a subscription:`, error);
      failed({ code: INTERNAL_ERROR, message: `Event ${eventId} could not be delivered and was skipped`, data: { eventId, reason: String(error?.message ?? error) } });
      return undefined;
    }
    return { ...occurrence, data, cursor: position(type, sequence) };
  };

  // The event type and arguments a request names, checked as the sketch's errors require, in its order: the type,
  // the delivery mode, the request's own fields, the arguments, and then whether the caller may subscribe. A caller
  // refused loses what it holds of that subscription at once.
  const subscription = async ({ name, arguments: args = {}, cursor, maxAgeMs, maxEvents }: Record<string, unknown>, context: SubscriptionContext, delivery: DeliveryModeName): Promise<{ type: Type; subscription: Requested }> => {
    const type = types.get(name as string);
    if (!type) throw refusal(removed);
    if (!type.delivery.includes(delivery)) throw refusal({ code: UNSUPPORTED, message: "Unsupported", data: { feature: "deliveryMode", value: delivery } });
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

  const endSubscription = (type: Type, id: string, error: EventError) => {
    for (const held of [...type.subscriptions.get(id)?.held ?? []]) held.end(error);
  };

  // Begins holding a subscription, by a stream or a poll lease: counted against the limits first, so a refused one
  // provisions nothing. The type's onSubscribe is called when the first hold of an id begins, and its onUnsubscribe
  // when the last ends, so two streams of one subscription set it up once. `end` is how the holder is told the app
  // terminated it; `close` is how the holder says its hold is over.
  const open = async (type: Type, { id, delivery, arguments: args, context }: { id: string; delivery: DeliveryModeName; arguments: unknown; context: SubscriptionContext }, end: (error: EventError) => void): Promise<Held> => {
    if (types.get(type.name) !== type) throw refusal(removed);
    // Callers without an identity cannot be told apart, so they count together as one.
    const who = caller(context) ?? "anonymous";
    if (subscribed >= MAX_SUBSCRIPTIONS) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptions", max: MAX_SUBSCRIPTIONS } });
    if ((callers.get(who) ?? 0) >= MAX_SUBSCRIPTIONS_PER_CALLER) throw refusal({ code: RESOURCE_EXHAUSTED, message: "ResourceExhausted", data: { limit: "subscriptionsPerCaller", max: MAX_SUBSCRIPTIONS_PER_CALLER } });
    subscribed++;
    count(callers, who, 1);
    // A presence keeps a subscriber's value while any of its streams or leases is open.
    const subscriber = named(args);
    const hold = (by: number) => {
      count(type.holds, subscriber, by);
      for (const keep of type.present) keep(subscriber);
    };
    hold(1);
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
    const held: Held = { id, arguments: args, context, end, close() {
      if (closed) return;
      closed = true;
      subscribed--;
      count(callers, who, -1);
      hold(-1);
      current.held.delete(held);
      if (current.held.size) return;
      if (type.subscriptions.get(id) === current) type.subscriptions.delete(id);
      // Only a subscription that was set up is told it ended.
      current.ready.then(subscription => { if (type.onUnsubscribe) settle(() => type.onUnsubscribe!(subscription)); }, () => {});
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
      const fresh: Lease = { type, opening: open(type, { ...subscribed, id: key, delivery: "poll" }, error => {
        fresh.ended = error;
        fresh.release?.();
      }) };
      lent = fresh;
      leases.set(key, fresh);
      fresh.opening.then(held => {
        if (shared) held.untargetable = true;
        fresh.release = () => held.close();
        if (fresh.ended) held.close();
      }, () => { if (leases.get(key) === fresh) leases.delete(key); });
    }
    const current = lent;
    const held = await current.opening;
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

  return {
    /**
     * Declares an event type and returns the function that emits it. `match` decides which subscriptions receive an
     * event from their arguments, and `transform` shapes its data for each.
     */
    event<A, D>(name: string, { description, inputSchema, payloadSchema, _meta, match, transform, delivery = OFFERED, authorize, onSubscribe, onUnsubscribe }: EventDefinition<A, D>): Emitter<D, A> {
      if (types.has(name)) throw new Error(`Event ${name} is already declared.`);
      const unknown = delivery.filter(mode => !OFFERED.includes(mode));
      if (unknown.length || !delivery.length) throw new Error(`Event ${name} is delivered by ${delivery.join(", ") || "nothing"}, but only ${OFFERED.join(", ")} are served.`);
      const type: Type<A, D> = {
        name, order: ++declared, description, inputSchema, payloadSchema, _meta, delivery, match, transform, authorize, onSubscribe, onUnsubscribe,
        sequence: 0, dropped: 0, kept: [], sinks: new Set(), subscriptions: new Map(), holds: new Map(), present: new Set(),
      };
      types.set(name, type);
      const emitter: Emitter<D, A> = {
        emit(data, { eventId = crypto.randomUUID(), timestamp = new Date().toISOString(), subscriptionId: target } = {}) {
          const occurrence = { eventId, name, timestamp, data };
          // Data that cannot be sent as JSON is refused here, before anything is kept or sent.
          JSON.stringify(occurrence);
          // An event for one subscription is kept like any other, so the subscription has it when it comes back.
          const kept = { sequence: ++type.sequence, at: Date.now(), target, occurrence };
          type.kept.push(kept);
          while (type.kept.length > KEPT_EVENTS || type.kept[0]!.at < kept.at - KEPT_AGE) type.dropped = type.kept.shift()!.sequence;
          for (const sink of type.sinks) sink();
        },
        cursor() {
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
        presence<V>(told: (args: A, value: V | undefined) => D): Presence<A, V> {
          const values = new Map<string, { args: A; value: V; linger: number; leaving?: ReturnType<typeof setTimeout> }>();
          // A value has no timer while its subscriber holds a subscription, and leaves its linger after it stops.
          const keep = (subscriber: string) => {
            const shown = values.get(subscriber);
            if (!shown) return;
            clearTimeout(shown.leaving);
            if (type.holds.has(subscriber)) return;
            shown.leaving = setTimeout(() => {
              values.delete(subscriber);
              emitter.emit(told(shown.args, undefined));
            }, shown.linger);
            shown.leaving.unref?.();
          };
          type.present.add(keep);
          return {
            set(args, value, linger) {
              const subscriber = named(args);
              values.set(subscriber, { args, value, linger, leaving: values.get(subscriber)?.leaving });
              keep(subscriber);
              emitter.emit(told(args, value));
            },
            seen(args) {
              return [...values.values()]
                .filter(shown => !type.match || type.match(told(shown.args, shown.value), args, undefined))
                .map(({ value }) => value);
            },
          };
        },
      };
      return emitter;
    },

    /** Serves the declared event types on an MCP server: events/list, events/poll and events/stream. */
    serve(mcp) {
      // The custom methods are registered through the parts of the server this module uses.
      const server = ("server" in mcp ? mcp.server : mcp) as unknown as Served;
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

      server.setRequestHandler("events/poll", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "poll");
        // Taken before the lease, which waits for onSubscribe. The sketch's poll from null returns no events and a
        // fresh cursor: this one is where the subscription opened, so the next poll has what onSubscribe emitted.
        const opened = type.sequence;
        const held = await lease(type, subscribed);
        // Each poll is answered for its own caller, with the lease's id.
        const { events, start, failures, ...rest } = since(type, { ...subscribed, id: held.id, untargetable: held.untargetable }, request.cursor, { maxAgeMs: request.maxAgeMs, maxEvents: request.maxEvents, opened, ...(request.cursor == null && { until: opened }) });
        // A poll carries its cursor once, for the whole response.
        return { events: events.map(({ cursor, ...event }) => event), ...rest, nextPollMs: INTERVAL };
      });

      server.setRequestHandler("events/stream", { params }, async (request, ctx) => {
        const { type, subscription: subscribed } = await subscription(request, ctx.http, "push");
        const { signal } = ctx.mcpReq;
        const meta = { [SUBSCRIPTION_ID_META_KEY]: ctx.mcpReq.id };
        let done = false;
        let ending: EventError | undefined;
        // Set when the app terminates the stream: the last event emitted before, which the stream still sends.
        let until: number | undefined;
        let wake = () => {};
        const finish = () => {
          done = true;
          wake();
        };
        // What is emitted from here on is the stream's, so it has what onSubscribe emits to it.
        const opened = type.sequence;
        const held = await open(type, { ...subscribed, delivery: "push" }, error => {
          // Lost access ends delivery at once, even while what came before is still being sent. Otherwise only the
          // first end counts, and the stream first sends what was emitted before it.
          const lost = error.code === FORBIDDEN;
          if (ending && !lost) return;
          ending = error;
          if (lost) return finish();
          until = type.sequence;
          wake();
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
        let sent = 0;
        const notify = async (method: string, body: object) => {
          if (signal.aborted) return;
          const params = { ...body, _meta: meta };
          try {
            await ctx.mcpReq.notify({ method: `notifications/events/${method}`, params });
          } catch {
            finish();
          }
          if ((sent += JSON.stringify(params).length) > STREAM_BUDGET) finish();
        };
        // The stream follows its cursor, and emitted events wake it. What it is owed waits in the buffer, not here, so
        // a slow client is not owed more memory than one batch; when what it is owed is no longer kept, it is told of
        // the gap.
        let cursor: string | null = request.cursor ?? null;
        let behind = true;
        const sink = () => {
          // Nothing emitted after the app terminated the stream is for it.
          if (until !== undefined) return;
          behind = true;
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
          while (!done) {
            if (behind) {
              behind = false;
              const result = since(type, held, cursor, { ...(first && request.maxAgeMs !== undefined && { maxAgeMs: request.maxAgeMs }), opened, until });
              // The stream is confirmed before anything else is said on it.
              if (first || result.truncated) await notify("active", { cursor: result.start, truncated: result.truncated });
              if (first) beat = heartbeats();
              first = false;
              for (const error of result.failures) await notify("error", { error });
              for (const event of result.events) {
                if (done) break;
                await notify("event", event);
                cursor = event.cursor ?? null;
              }
              if (done) break;
              cursor = result.cursor;
            }
            // Terminated by the app, the stream ends once it has sent what was emitted before.
            if (done || until !== undefined && !behind) break;
            await new Promise<void>(resolve => {
              wake = resolve;
              if (done || behind) resolve();
            });
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

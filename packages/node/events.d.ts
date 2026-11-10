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
   * reconnecting streams learn of it from the check function, and one emitted to a subscription with no open stream
   * is lost, so that subscription's next poll or stream is told of a gap.
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
   */
  maxQueued?: number;
  /** How many bytes those notifications take, as JSON. An event is sent alone when nothing waits, whatever it weighs. 1 MiB unless given. */
  maxQueuedBytes?: number;
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
   * How many of those one caller may hold. A hundred unless given. Callers without an identity cannot be told
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
/** A delivery mode besides poll and push. It registers its requests on each server and is listed by events/list. */
export interface DeliveryMode {
  readonly name: string;
  serve(server: object, internals: object): void;
}
/** The event types of a process, served by each MCP server it creates. */
export interface Events {
  /** Declares an event type. Emit its occurrences with the returned emitter. */
  event<A, D>(name: string, definition: EventDefinition<A, D>): Emitter<D>;
  /** Serves events/list, events/poll and events/stream on an McpServer or a Server, and declares the extension. */
  serve(server: object): void;
}
/** The identifier a server declares the Events extension under, in capabilities.extensions. */
export declare const EVENTS_EXTENSION: "io.modelcontextprotocol/events";
/**
 * Event types served as MCP Events, the draft extension of the Triggers & Events Working Group, in its poll and push
 * delivery modes. An event type either has a check function, whose cursors are its source's and outlive the process,
 * or keeps what it emits in memory, whose cursors last as long as the process: after a restart a client is told that
 * events were skipped.
 */
export declare function createEvents(options?: EventsOptions): Events;

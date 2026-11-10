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
 * delivery modes. Events are kept in memory, so a cursor lasts as long as the process: after a restart a client is
 * told that events were skipped.
 */
export declare function createEvents(options?: EventsOptions): Events;

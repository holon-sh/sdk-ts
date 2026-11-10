import type { DeliveryMode } from "./events.js";

/** A webhook subscription as the server keeps it. Its secret signs deliveries, so a store keeps it as it would a key. */
export interface WebhookSubscription {
  /** Derived from the principal, callback URL, event name and arguments, which together are the subscription. */
  id: string;
  principal: { issuer: string; subject: string };
  url: string;
  name: string;
  secret: string;
  /** The secret a refresh replaced, which still signs deliveries until `until`. */
  previous?: { secret: string; until: number };
  /** When the subscription lapses unless refreshed, in milliseconds since the epoch. Null when it does not. */
  expiresAt: number | null;
  /** The subscription's checked arguments, and the caller match and transform are given. */
  subscription: { arguments: unknown; context: unknown };
}
/** Keeps webhook subscriptions across restarts. Without one they live in memory, and clients subscribe again when they refresh. */
export interface WebhookStore {
  /** Every subscription kept. Read once, when the first server is served. */
  load(): Iterable<WebhookSubscription> | Promise<Iterable<WebhookSubscription>>;
  save(subscription: WebhookSubscription): void | Promise<void>;
  remove(id: string): void | Promise<void>;
}
export interface WebhookOptions {
  /**
   * The longest lifetime granted to a subscription, in milliseconds: a client's suggestion is held to it. Thirty
   * minutes unless given. Null lets a client ask for no expiry, which needs a store.
   */
  ttl?: number | null;
  /** The shortest lifetime granted, so clients do not refresh too often. One minute unless given. */
  minTtl?: number;
  /** Where subscriptions are kept. In memory unless given. */
  store?: WebhookStore;
  /** How many times an event is sent before it is given up on. Five unless given. */
  attempts?: number;
  /** The wait before the first retry, in milliseconds; each wait is five times the last. Five seconds unless given. */
  backoff?: number;
  /** How long a delivery has, from connecting to its answer, in milliseconds. Five seconds unless given. */
  timeout?: number;
  /** How often a subscription's arguments and authorization are checked again before delivery, in milliseconds. One minute unless given. */
  reverify?: number;
  /** How many events may be in flight to one subscription. Beyond it events are skipped, and the client is told of the gap. A thousand unless given. */
  maxPending?: number;
  /** How many subscriptions one principal may hold. Beyond it a subscribe is refused with -32025. A hundred unless given. */
  maxSubscriptions?: number;
  /** How many deliveries run to one endpoint at once. Four unless given. */
  concurrency?: number;
  /** For tests only: accepts http callbacks and callbacks at private addresses, such as a receiver on localhost. */
  allowInsecureLocalCallbacksForTesting?: boolean;
}
/**
 * Webhook delivery of MCP Events, for createEvents' modes. It serves events/subscribe and events/unsubscribe to
 * authenticated callers, verifies each callback by a challenge before delivering to it, signs each delivery per
 * Standard Webhooks with the client's secret, retries failed ones, and lets subscriptions lapse when not refreshed.
 */
export declare function webhooks(options?: WebhookOptions): DeliveryMode;

/** Mount at the callback URL. It answers each delivery a server POSTs there. */
export interface WebhookReceiver {
  (request: Request): Promise<Response>;
  /** @internal Used by the runtime's subscribe. */
  listen(handle: (message: unknown) => void): { readonly secret: string; bind(id: string): void; close(): boolean };
}
/**
 * The client's end of webhook delivery, as a function from a Request to a Response. Give it to createApps with the
 * URL it is reached at, and mount it there: subscriptions then prefer webhook delivery where a server offers it.
 * `tolerance` is how old a delivery may be, in seconds. Five minutes unless given.
 */
export declare function createReceiver(options?: { tolerance?: number }): WebhookReceiver;

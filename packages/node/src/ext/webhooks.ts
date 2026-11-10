// Webhook delivery of MCP Events, both sides, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#webhook-based-delivery
// The server side is a delivery mode for createEvents. The client side is a receiver an application mounts at its
// callback URL, which the runtime's subscribe hands deliveries from. Nothing here needs a Node module until it sends:
// a server is evaluated for its contract where node:crypto and its neighbours are not there.
import { ProtocolError } from "@modelcontextprotocol/server";
import type { Server, ServerContext, StandardSchemaV1 } from "@modelcontextprotocol/server";
import type { BlockList, LookupFunction } from "node:net";
import { getContext } from "../context.js";
import type { DeliveryMode, EventError, EventTypeState, Internals, Owed, Occurrence, SubscriptionContext } from "./events.js";

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
  /** The id again, the subscription's checked arguments, and the caller match, transform and authorize are given. */
  subscription: { id: string; arguments: unknown; context: SubscriptionContext };
}
/** Keeps webhook subscriptions across restarts. Without one they live in memory, and clients subscribe again when they refresh. */
export interface WebhookStore {
  /** Every subscription kept. Read once, when the first event type is declared. */
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
  /** How often each subscription's access is checked again with its type's authorize, in milliseconds. One minute unless given. */
  reverify?: number;
  /** How many events may be in flight to one subscription. Beyond it events are skipped, and the client is told of the gap. A thousand unless given. */
  maxPending?: number;
  /** How many deliveries run to one endpoint at once. Four unless given. */
  concurrency?: number;
  /** For tests only: accepts http callbacks and callbacks at private addresses, such as a receiver on localhost. */
  allowInsecureLocalCallbacksForTesting?: boolean;
}
/** Mount at the callback URL. It answers each delivery a server POSTs there. */
export interface WebhookReceiver {
  (request: Request): Promise<Response>;
  /** @internal Used by the runtime's subscribe. */
  listen(handle: (message: unknown) => void): { readonly secret: string; bind(id: string): void; close(): boolean };
}

const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
const FORBIDDEN = -32024;
const RESOURCE_EXHAUSTED = -32025;
const UNSUPPORTED = -32026;
const CALLBACK_ENDPOINT_ERROR = -32027;
// A body over this is refused by many receivers, so the sketch asks servers to stay under it.
const MAX_BODY = 256 * 1024;
// Old and new secrets both sign deliveries this long after a refresh changes the secret, so in-flight ones verify.
const ROTATION_GRACE = 5 * 60_000;
// A subscription whose deliveries fail this often over this window, with at least this many attempts, is suspended.
const SUSPEND = { window: 60 * 60_000, attempts: 100, rate: 0.95 };
// A URL whose challenge failed is not challenged again for this long, and a host at most this often.
const FAILED_CHALLENGE = 10 * 60_000;
const VERIFICATIONS = { window: 60_000, max: 10 };
// How many hosts one principal may have challenged for the first time in a window.
const PROBES = { window: 10 * 60_000, max: 5 };
// Re-checks of access that fail this many times in a row end a subscription.
const UNANSWERED = 3;
// The protocol's own refusals, which end a subscription. Anything else may pass, and is tried again.
const REFUSALS = [INVALID_PARAMS, NOT_FOUND, FORBIDDEN, RESOURCE_EXHAUSTED, UNSUPPORTED, CALLBACK_ENDPOINT_ERROR];

/** The fields of events/subscribe and events/unsubscribe this module reads. They are checked here. */
interface WebhookRequest {
  name?: string;
  arguments?: unknown;
  cursor?: string | null;
  maxAgeMs?: number;
  ttlMs?: number | null;
  delivery?: { mode?: unknown; url?: unknown; secret?: unknown };
  [field: string]: unknown;
}
// Requests are checked by their handlers, against the sketch.
const anything: StandardSchemaV1<unknown, WebhookRequest> = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: (value ?? {}) as WebhookRequest }) } };

const encoder = new TextEncoder();
const base64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unbase64 = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const random = (bytes: number) => crypto.getRandomValues(new Uint8Array(bytes));
const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");

// A Standard Webhooks symmetric secret: whsec_ and the base64 of 24 to 64 random bytes.
function secretBytes(secret: unknown): Uint8Array<ArrayBuffer> | undefined {
  const match = typeof secret === "string" ? /^whsec_([A-Za-z0-9+/]+={0,2})$/.exec(secret) : null;
  if (!match?.[1]) return undefined;
  try {
    const bytes = unbase64(match[1]);
    return bytes.length >= 24 && bytes.length <= 64 ? bytes : undefined;
  } catch { return undefined; }
}

// HMAC-SHA256 of `id.timestamp.body` under the secret, the signature Standard Webhooks defines.
async function sign(secret: string, id: string, timestamp: number | string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", secretBytes(secret)!, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64(await crypto.subtle.sign("HMAC", key, encoder.encode(`${id}.${timestamp}.${body}`)));
}
async function verifies(secret: string, id: string, timestamp: string, body: string, signature: Uint8Array<ArrayBuffer>): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", secretBytes(secret)!, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(`${id}.${timestamp}.${body}`));
}

// JSON with object keys in order, so arguments that are equal give the same subscription.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const fields = value as Record<string, unknown>;
    return `{${Object.keys(fields).sort().filter(key => fields[key] !== undefined).map(key => `${JSON.stringify(key)}:${canonical(fields[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function equal(a: unknown, b: string): boolean {
  if (typeof a !== "string" || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

// Addresses that are not globally routable, from the IANA special-purpose registries, and IPv4-compatible IPv6. A
// callback never reaches them.
const PRIVATE = {
  ipv4: ["0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/3"],
  ipv6: ["::/96", "::ffff:0:0/96", "64:ff9b::/96", "64:ff9b:1::/48", "100::/64", "100:0:0:1::/64", "2001::/23", "2001:db8::/32", "2002::/16", "3fff::/20", "5f00::/16", "fc00::/7", "fe80::/10", "ff00::/8"],
} as const;
let blocked: BlockList | undefined;

/** How a POST to a callback went: `ok` and the start of the answer's `body`, or the sketch's category of `error`. */
interface Posted { ok?: boolean; status?: number; body?: string; error?: string }

/**
 * POSTs a signed body to a callback and says how it went. The address is checked when the request connects, after
 * the name is resolved, so a name that resolves to a private address later cannot be used to reach one. Redirects are
 * not followed, and the whole exchange has `timeout` milliseconds, so an endpoint that answers slowly cannot hold it
 * open.
 */
async function post(url: string, headers: Record<string, string>, body: string, { timeout, local }: { timeout: number; local: boolean }): Promise<Posted> {
  const target = new URL(url);
  // node:https takes the same requests as node:http, over TLS.
  const [{ request }, dns, net] = await Promise.all([import(target.protocol === "https:" ? "node:https" : "node:http") as Promise<typeof import("node:http")>, import("node:dns"), import("node:net")]);
  if (!blocked) {
    blocked = new net.BlockList();
    for (const [type, ranges] of Object.entries(PRIVATE)) for (const range of ranges) {
      const [address = "", prefix] = range.split("/");
      blocked.addSubnet(address, Number(prefix), type as "ipv4" | "ipv6");
    }
  }
  const list = blocked;
  const reachable = (address: string) => local || !list.check(address, net.isIP(address) === 6 ? "ipv6" : "ipv4");
  const host = target.hostname.replace(/^\[|\]$/g, "");
  // A literal address is connected to without a lookup, so it is checked here.
  if (net.isIP(host) && !reachable(host)) return { error: "connection_refused" };
  const lookup: LookupFunction = (hostname, options, callback) => dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 4);
    const allowed = addresses.filter(({ address }) => reachable(address));
    const first = allowed[0];
    if (!first) return callback(Object.assign(new Error(`${hostname} resolves to no public address`), { code: "ECONNREFUSED" }), "", 4);
    if (options.all) (callback as (error: null, addresses: typeof allowed) => void)(null, allowed);
    else callback(null, first.address, first.family);
  });
  const bytes = encoder.encode(body);
  return new Promise(resolve => {
    let outgoing: ReturnType<typeof request> | undefined;
    const done = (result: Posted) => {
      clearTimeout(deadline);
      outgoing?.destroy();
      resolve(result);
    };
    const deadline = setTimeout(() => done({ error: "timeout" }), timeout);
    deadline.unref?.();
    try {
      outgoing = request(target, { method: "POST", agent: false, lookup, headers: { ...headers, "content-type": "application/json", "content-length": bytes.length } }, response => {
        const status = response.statusCode ?? 0;
        const ok = status >= 200 && status < 300;
        const chunks: Buffer[] = [];
        let size = 0;
        // Only the start of an answer is kept, which a challenge's echo fits in, so the rest is not read.
        const finish = () => done({ ok, status, body: Buffer.concat(chunks).subarray(0, 4096).toString(), ...(!ok && { error: status >= 500 ? "http_5xx" : "http_4xx" }) });
        response.on("data", (chunk: Buffer) => { chunks.push(chunk); if ((size += chunk.length) >= 4096) finish(); });
        response.on("end", finish);
        response.on("error", finish);
      });
    } catch {
      // A header Node will not send, such as an eventId outside Latin-1, fails here rather than on the wire.
      return done({ error: "connection_refused" });
    }
    outgoing.on("error", (error: NodeJS.ErrnoException) => done({ error: /TLS|SSL|CERT|SELF_SIGNED|UNABLE_TO|DEPTH_ZERO/.test(error.code ?? "") ? "tls_error" : "connection_refused" }));
    outgoing.end(bytes);
  });
}

/** A message waiting to be sent to a subscription's callback: an event, or a control envelope. */
interface Entry { state: State; id: string; tries: number; body(): string; event?: Occurrence; cursor?: string | null | undefined; settled?: boolean }
/** What delivering to one subscription has come to. */
interface State {
  type: EventTypeState;
  opened?: { close(): void };
  queue: Entry[];
  held: Entry[];
  floor?: string | null | undefined;
  reached?: string | null;
  active: boolean;
  outcomes: Array<{ at: number; ok: boolean }>;
  gap: boolean;
  unknown: number;
  timer?: ReturnType<typeof setTimeout>;
  lastDeliveryAt?: string;
  lastError?: string | null;
  failedSince?: string | undefined;
}
/** Where a callback is reached, and how deliveries to it are signed. */
type Callback = Pick<WebhookSubscription, "id" | "url" | "secret" | "previous">;

/**
 * Webhook delivery of MCP Events, for createEvents' modes. It serves events/subscribe and events/unsubscribe to
 * authenticated callers, verifies each callback by a challenge before delivering to it, signs each delivery per
 * Standard Webhooks with the client's secret, retries failed ones, and lets subscriptions lapse when not refreshed.
 */
export function webhooks({
  ttl = 30 * 60_000,
  minTtl = 60_000,
  store,
  attempts = 5,
  backoff = 5000,
  timeout = 5000,
  reverify = 60_000,
  maxPending = 1000,
  concurrency = 4,
  allowInsecureLocalCallbacksForTesting = false,
}: WebhookOptions = {}): DeliveryMode {
  // A subscription that never expires is never refreshed, so it must outlive the process: that needs a store.
  if (ttl === null && !store) throw new Error("Webhook subscriptions without expiry need a store that keeps them across restarts.");
  const local = allowInsecureLocalCallbacksForTesting === true;
  // Subscriptions being delivered to, by event name, then id; and what delivering to each has come to, which is kept
  // in memory only, lost on restart and begun again.
  const live = new Map<string, Map<string, WebhookSubscription>>();
  const states = new WeakMap<WebhookSubscription, State>();
  // Kept subscriptions whose event type is not declared yet.
  const parked = new Map<string, WebhookSubscription[]>();
  // Callback URLs each principal has proved it receives at, so their next subscriptions are not challenged again; URLs
  // whose challenge failed; and when each host was challenged lately.
  const verified = new Map<string, number>();
  const failed = new Map<string, { until: number; reason: string }>();
  const challenged = new Map<string, number[]>();
  // The hosts each principal had challenged lately, so one caller cannot have the server reach many new hosts.
  const probed = new Map<string, Map<string, number>>();
  // Deliveries running to each endpoint, and those waiting for one of them to finish.
  const endpoints = new Map<string, { running: number; waiting: Array<() => void> }>();
  const attached = new WeakSet<EventTypeState>();
  let internals!: Internals;
  let loaded: Promise<void> | undefined;

  const quietly = (promise: unknown) => void Promise.resolve(promise).catch(() => {});
  const principalOf = (context: SubscriptionContext) => {
    const { principal } = getContext(context);
    return principal && { issuer: principal.issuer, subject: principal.subject };
  };
  const owner = (principal: WebhookSubscription["principal"], url: string) => canonical([principal.issuer, principal.subject, url]);
  const endpointError = (reason: string | undefined) => new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason });
  const expired = (record: WebhookSubscription) => record.expiresAt !== null && record.expiresAt <= Date.now();
  const refreshBefore = (record: WebhookSubscription) => record.expiresAt === null ? null : new Date(record.expiresAt).toISOString();
  const codeOf = (error: unknown) => (error as Partial<EventError> | undefined)?.code;

  // Stops delivering to a subscription and lets go of its place among its type's subscriptions. A newer subscription
  // with the same id is not this one's to remove.
  const forget = async (record: WebhookSubscription) => {
    const state = states.get(record);
    states.delete(record);
    clearTimeout(state?.timer);
    state?.opened?.close();
    const records = live.get(record.name);
    if (records?.get(record.id) !== record) return;
    records.delete(record.id);
    await store?.remove(record.id);
  };

  // The safe-to-persist cursor: every event at or before it has been acknowledged or given up on.
  const watermark = (state: State) => state.queue.length ? state.floor ?? null : state.type.check ? state.reached ?? null : internals.position(state.type);

  // A few deliveries run to one endpoint at a time, so a slow or flooded one holds neither connections nor the rest.
  const slot = async (url: string) => {
    const { origin } = new URL(url);
    let endpoint = endpoints.get(origin);
    if (!endpoint) endpoints.set(origin, endpoint = { running: 0, waiting: [] });
    const current = endpoint;
    if (current.running < concurrency) current.running++;
    else await new Promise<void>(resolve => current.waiting.push(resolve));
    return () => {
      const next = current.waiting.shift();
      if (next) return next();
      if (--current.running === 0) endpoints.delete(origin);
    };
  };

  const send = async (record: Callback, id: string, body: string) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const secrets = [record.secret, ...(record.previous && record.previous.until > Date.now() ? [record.previous.secret] : [])];
    const signatures = await Promise.all(secrets.map(async secret => `v1,${await sign(secret, id, timestamp, body)}`));
    const release = await slot(record.url);
    try {
      return await post(record.url, { "webhook-id": id, "webhook-timestamp": String(timestamp), "webhook-signature": signatures.join(" "), "X-MCP-Subscription-Id": record.id }, body, { timeout, local });
    } finally { release(); }
  };
  const control = (type: string) => `msg_${type}_${hex(random(12))}`;

  // Tells a callback its subscription has ended, and why. It no longer exists, so this is sent once.
  const terminated = (record: WebhookSubscription, error: EventError) => send(record, control("terminated"), JSON.stringify({
    type: "terminated", error: { code: error.code, message: error.message, ...(error.data !== undefined && { data: error.data }) },
  })).catch(() => {});
  // Ends a subscription the server no longer serves.
  const terminate = async (record: WebhookSubscription, error: EventError) => {
    if (!states.has(record)) return;
    await forget(record).catch(() => {});
    await terminated(record, error);
  };

  // Events skipped, while too many were in flight or because the source moved past them, are a gap the client hears
  // of once the rest are through.
  const flush = (record: WebhookSubscription, state: State) => {
    if (state.queue.length || !state.gap) return;
    state.gap = false;
    const body = JSON.stringify({ type: "gap", cursor: watermark(state) });
    quietly(attempt(record, { state, id: control("gap"), tries: 0, body: () => body }));
  };

  const settle = (record: WebhookSubscription, entry: Entry) => {
    entry.settled = true;
    const { state } = entry;
    for (let first = state.queue[0]; first?.settled; first = state.queue[0]) {
      state.queue.shift();
      state.floor = first.cursor;
    }
    flush(record, state);
  };

  const outcome = (record: WebhookSubscription, state: State, result: Posted) => {
    const now = Date.now();
    state.outcomes.push({ at: now, ok: Boolean(result.ok) });
    for (let first = state.outcomes[0]; first && (first.at < now - SUSPEND.window || state.outcomes.length > SUSPEND.attempts * 10); first = state.outcomes[0]) state.outcomes.shift();
    if (result.ok) Object.assign(state, { lastDeliveryAt: new Date(now).toISOString(), lastError: null, failedSince: undefined });
    else Object.assign(state, { lastError: result.error, failedSince: state.failedSince ?? new Date(now).toISOString() });
    const failures = state.outcomes.filter(({ ok }) => !ok).length;
    if (state.active && state.outcomes.length >= SUSPEND.attempts && failures / state.outcomes.length > SUSPEND.rate) {
      state.active = false;
      // A subscription without expiry has no refresh to bring it back, so it is dropped.
      if (record.expiresAt === null) quietly(terminate(record, endpointError(result.error)));
    }
  };

  // Each message is retried on its own, with backoff, until it is acknowledged, refused for good, or out of attempts.
  // While delivery is suspended it waits, without spending its attempts, for a refresh to resume it.
  const attempt = async (record: WebhookSubscription, entry: Entry): Promise<void> => {
    const { state } = entry;
    // A message of a subscription since ended, or made again, is not sent.
    if (states.get(record) !== state) return;
    if (expired(record)) return void (entry.event && settle(record, entry));
    // Messages wait while delivery is suspended, and while the caller's access is not known.
    if (!state.active || state.unknown) return void state.held.push(entry);
    let body: string | undefined;
    try { body = entry.body(); } catch { body = undefined; }
    // A body that cannot be made, or one too large for receivers, is given up on, as a receiver's 413 would be.
    if (body === undefined || encoder.encode(body).length > MAX_BODY) return void (entry.event && settle(record, entry));
    const result = await send(record, entry.id, body);
    if (states.get(record) !== state) return;
    // A receiver declining an event (410) or refusing its size (413) says nothing about the subscription, and is not retried.
    const declined = result.status === 410 || result.status === 413;
    if (!declined) outcome(record, state, result);
    if (result.ok || declined || ++entry.tries >= attempts) return void (entry.event && settle(record, entry));
    if (!state.active || state.unknown) return void state.held.push(entry);
    setTimeout(() => quietly(attempt(record, entry)), backoff * 5 ** (entry.tries - 1)).unref?.();
  };

  const enqueue = (record: WebhookSubscription, event: Occurrence) => {
    const state = states.get(record);
    if (!state) return;
    // Beyond what may be in flight, events are skipped, and the client is told of the gap.
    if (state.queue.length >= maxPending) return void (state.gap = true);
    if (state.queue.some(entry => entry.id === event.eventId)) return;
    // What a type with a check function emits carries no cursor of its own, and is placed where the subscription is.
    const entry: Entry = { state, id: event.eventId, event, cursor: event.cursor ?? state.reached, tries: 0, body: () => JSON.stringify({ ...event, cursor: state.queue[0] === entry ? entry.cursor : state.floor }) };
    state.queue.push(entry);
    quietly(attempt(record, entry));
  };

  // A type with a check function is asked every interval for what each subscription is owed since its cursor.
  const follow = (record: WebhookSubscription, state: State, wait = state.type.interval) => {
    state.timer = setTimeout(async () => {
      let more = false;
      try {
        const result = await internals.read(state.type, record.subscription, state.reached);
        if (states.get(record) !== state) return;
        for (const event of result.events) enqueue(record, event);
        state.reached = result.cursor;
        more = result.hasMore;
        if (result.truncated) { state.gap = true; flush(record, state); }
      } catch {
        // A check that fails is asked again at the next interval.
      }
      if (states.get(record) === state) follow(record, state, more ? 0 : undefined);
    }, wait);
    state.timer.unref?.();
  };

  // Begins delivering to a subscription from a cursor: it takes its place among its type's subscriptions, counted
  // against the limits, with the type's onSubscribe run; `ready` runs once it has; and it is sent what it missed
  // since the cursor first. An end that arrives meanwhile is kept, and once setup is done the subscription ends with
  // it, having delivered nothing.
  const begin = async (type: EventTypeState, record: WebhookSubscription, cursor: string | null | undefined, maxAgeMs?: number, ready?: () => Promise<void>) => {
    const state: State = { type, queue: [], held: [], active: true, outcomes: [], gap: false, unknown: 0 };
    let ending: EventError | undefined;
    const end = (error: EventError) => {
      if (states.get(record) === state) quietly(terminate(record, error));
      else ending ??= error;
    };
    const opened = await internals.open(type, { id: record.id, delivery: "webhook", arguments: record.subscription.arguments, context: record.subscription.context }, end);
    state.opened = opened;
    let missed: Owed;
    try {
      await ready?.();
      // Events emitted while it is read are in what it returns, and none are emitted between it and the sink seeing
      // this subscription, as reading emitted events does not wait.
      const reading = internals.read(type, record.subscription, cursor ?? null, { maxAgeMs });
      missed = reading instanceof Promise ? await reading : reading;
      // Set by `end` while this waited, which the narrowing above does not see.
      const ended = ending as EventError | undefined;
      if (ended) throw new ProtocolError(ended.code, ended.message, ended.data);
    } catch (error) {
      opened.close();
      throw error;
    }
    Object.assign(state, { floor: missed.start, reached: missed.cursor });
    states.set(record, state);
    let records = live.get(record.name);
    if (!records) live.set(record.name, records = new Map());
    const prior = records.get(record.id);
    records.set(record.id, record);
    if (prior && prior !== record) quietly(forget(prior));
    for (const event of missed.events) enqueue(record, event);
    if (type.check) follow(record, state);
    return missed;
  };

  // A kept subscription resumes from where its type is now, once its type is declared. One the server refuses is
  // ended; one that fails otherwise, as a check or onSubscribe may once, is tried again, a little later each time.
  const resume = async (type: EventTypeState, record: WebhookSubscription, wait = 1000): Promise<void> => {
    if (expired(record) || internals.types.get(type.name) !== type) return void await store?.remove(record.id);
    try { await begin(type, record, null); } catch (error) {
      const code = codeOf(error);
      if (code === undefined || !REFUSALS.includes(code)) return void setTimeout(() => quietly(resume(type, record, Math.min(wait * 2, 5 * 60_000))), wait).unref?.();
      await store?.remove(record.id);
      await terminated(record, error as EventError);
    }
  };

  // Each emitted event goes to the subscriptions of its type it is for.
  const attach = (type: EventTypeState) => {
    if (attached.has(type)) return;
    attached.add(type);
    type.sinks.add(emitted => {
      for (const record of [...(live.get(type.name)?.values() ?? [])]) {
        if (states.get(record)?.type !== type) continue;
        if (expired(record)) { quietly(forget(record)); continue; }
        const event = internals.shape(type, emitted, record.subscription);
        if (event) enqueue(record, event);
      }
    });
    for (const record of parked.get(type.name)?.splice(0) ?? []) quietly(resume(type, record));
  };

  // Expired subscriptions and stale verifications are let go of now and then, without keeping the process alive.
  const sweep = () => {
    const now = Date.now();
    for (const records of live.values()) for (const record of records.values()) if (expired(record)) quietly(forget(record));
    for (const [key, until] of verified) if (until <= now) verified.delete(key);
    for (const [url, { until }] of failed) if (until <= now) failed.delete(url);
    for (const [host, times] of challenged) if ((times.at(-1) ?? 0) <= now - VERIFICATIONS.window) challenged.delete(host);
    for (const [who, hosts] of probed) if ([...hosts.values()].every(at => at <= now - PROBES.window)) probed.delete(who);
    // A store that failed to load is read again.
    quietly(load());
  };

  // Access is checked again every `reverify` milliseconds, so a subscription whose caller lost it stops, whether or
  // not it expires. A check that throws is no answer: the subscription's messages wait until one comes, and after a
  // few in a row it ends with the error. One subscription's check never stops the others'.
  let checking = false;
  const recheck = async () => {
    if (checking) return;
    checking = true;
    try {
      for (const records of [...live.values()]) for (const record of [...records.values()]) {
        const state = states.get(record);
        if (!state?.type.authorize) continue;
        try {
          let holds: boolean;
          try {
            holds = await state.type.authorize(record.subscription.arguments, record.subscription.context);
          } catch (error) {
            if (states.get(record) !== state) continue;
            const { code, message, data } = (error ?? {}) as Partial<EventError>;
            if (++state.unknown >= UNANSWERED) await terminate(record, { code: Number.isInteger(code) ? code! : INTERNAL_ERROR, message: message || "InternalError", ...(data !== undefined && { data }) });
            continue;
          }
          if (states.get(record) !== state) continue;
          if (!holds) { await terminate(record, new ProtocolError(FORBIDDEN, "Forbidden")); continue; }
          if (state.unknown) {
            state.unknown = 0;
            for (const entry of state.held.splice(0)) quietly(attempt(record, entry));
          }
        } catch {
          // Ending one subscription failed; the others are still checked.
        }
      }
    } finally { checking = false; }
  };

  // Reads the store once. One that fails to load fails the subscribe or unsubscribe waiting for it, and is read again
  // at the next, or at the next sweep.
  const load = (): Promise<void> => loaded ??= Promise.resolve().then(() => store?.load()).then(records => {
    for (const record of records ?? []) {
      // A kept subscription exists only because its endpoint was verified, so it is not challenged again.
      verified.set(owner(record.principal, record.url), Infinity);
      const type = internals.types.get(record.name);
      if (type && attached.has(type)) quietly(resume(type, record));
      else {
        let waiting = parked.get(record.name);
        if (!waiting) parked.set(record.name, waiting = []);
        waiting.push(record);
      }
    }
  }, error => {
    loaded = undefined;
    throw error;
  });
  // Delivery begins as soon as the first event type is declared: kept subscriptions are read, and resume without
  // waiting for a server to be served or a client to subscribe again.
  let started = false;
  const start = (given: Internals) => {
    internals = given;
    if (started) return;
    started = true;
    quietly(load());
    setInterval(sweep, 60_000).unref?.();
    setInterval(() => quietly(recheck()), reverify).unref?.();
  };

  // The endpoint proves it wants deliveries by echoing a challenge, signed like any delivery. A URL whose challenge
  // failed is not challenged again for a while, and a host only so often, so subscribing cannot be used to make the
  // server POST wherever a caller likes.
  const verify = async (principal: WebhookSubscription["principal"], url: string, id: string, secret: string) => {
    const key = owner(principal, url);
    const now = Date.now();
    if ((verified.get(key) ?? 0) > now) return;
    const failure = failed.get(url);
    if (failure && failure.until > now) throw endpointError(failure.reason);
    const { host } = new URL(url);
    const recent = (challenged.get(host) ?? []).filter(at => at > now - VERIFICATIONS.window);
    if (recent.length >= VERIFICATIONS.max) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "verifications", max: VERIFICATIONS.max });
    const who = canonical([principal.issuer, principal.subject]);
    const hosts = probed.get(who) ?? new Map<string, number>();
    for (const [each, at] of hosts) if (at <= now - PROBES.window) hosts.delete(each);
    if (!hosts.has(host) && hosts.size >= PROBES.max) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "verificationHosts", max: PROBES.max });
    probed.set(who, hosts.set(host, now));
    challenged.set(host, [...recent, now]);
    const challenge = hex(random(24));
    const result = await send({ id, url, secret }, control("verification"), JSON.stringify({ type: "verification", challenge }));
    let echoed: unknown;
    try { echoed = (JSON.parse(result.body ?? "") as { challenge?: unknown }).challenge; } catch {}
    if (!result.ok || !equal(echoed, challenge)) {
      const reason = result.ok ? "challenge_failed" : result.error ?? "connection_refused";
      failed.set(url, { until: Date.now() + FAILED_CHALLENGE, reason });
      throw endpointError(reason);
    }
    verified.set(key, Date.now() + Math.max(ttl ?? 0, 24 * 60 * 60_000));
  };

  // Only what match, transform and authorize may read of the subscribing request is kept: never its token.
  const keep = (context: SubscriptionContext): SubscriptionContext => {
    const authInfo = context?.authInfo;
    return authInfo && { authInfo: { clientId: authInfo.clientId, scopes: authInfo.scopes, ...(authInfo.extra && { extra: authInfo.extra }) } };
  };

  // The subscription a request names, checked as the events of every mode are, with the type's authorization. Its
  // id is made from the key the type gives the caller, event and arguments, and the callback URL. A caller with a
  // principal always has that key.
  const keyed = async (request: WebhookRequest, context: SubscriptionContext) => {
    const principal = principalOf(context);
    if (!principal) throw new ProtocolError(FORBIDDEN, "Forbidden", { reason: "Webhook delivery needs an authenticated principal." });
    const url = request.delivery?.url;
    let parsed: URL | undefined;
    try { parsed = new URL(String(url)); } catch {}
    if (typeof url !== "string" || !parsed || parsed.protocol !== "https:" && !(local && parsed.protocol === "http:") || parsed.username || parsed.password)
      throw new ProtocolError(INVALID_PARAMS, "delivery.url must be an https URL.");
    const { type, subscription } = await internals.subscription(request, context, "webhook");
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify([subscription.lease, url])));
    const id = `sub_${hex(digest).slice(0, 32)}`;
    return { type, principal, url, id, subscription: { id, arguments: subscription.arguments, context: keep(subscription.context) } };
  };

  // The granted lifetime: the client's suggestion within the server's floor and cap. No expiry only when both allow it.
  const grant = (suggested: unknown) => {
    if (suggested === null && ttl === null) return null;
    const cap = ttl ?? Infinity;
    const wanted = typeof suggested === "number" && suggested > 0 ? suggested : cap === Infinity ? 24 * 60 * 60_000 : cap;
    return Math.max(minTtl, Math.min(wanted, cap));
  };

  return {
    name: "webhook",
    declared(type, given) {
      start(given);
      attach(type);
    },
    serve(served, given) {
      const server = served as Server;
      start(given);
      for (const type of internals.types.values()) attach(type);
      server.setRequestHandler("events/subscribe", { params: anything }, async (request, ctx: ServerContext) => {
        await load();
        if (request.delivery?.mode !== undefined && request.delivery.mode !== "webhook") throw new ProtocolError(INVALID_PARAMS, "delivery.mode must be webhook.");
        const secret = request.delivery?.secret;
        if (typeof secret !== "string" || !secretBytes(secret)) throw new ProtocolError(INVALID_PARAMS, "delivery.secret must be whsec_ and the base64 of 24 to 64 bytes.");
        const { type, subscription, principal, url, id } = await keyed(request, ctx.http);
        attach(type);
        const granted = grant(request.ttlMs);
        const expiresAt = granted === null ? null : Date.now() + granted;
        const existing = live.get(type.name)?.get(id);
        const state = existing && states.get(existing);
        if (existing && state?.type === type && !expired(existing)) {
          // A refresh: the TTL is granted again, a new secret replaces the old, and suspended delivery resumes.
          const deliveryStatus = { active: state.active, lastDeliveryAt: state.lastDeliveryAt ?? null, lastError: state.lastError ?? null, ...(state.failedSince && { failedSince: state.failedSince }) };
          Object.assign(existing, {
            expiresAt,
            subscription,
            ...(existing.secret !== secret && { secret, previous: { secret: existing.secret, until: Date.now() + ROTATION_GRACE } }),
          });
          await store?.save(existing);
          // Failures before the refresh do not count toward suspending it again.
          Object.assign(state, { active: true, outcomes: [] });
          for (const entry of state.held.splice(0)) quietly(attempt(existing, entry));
          return { id, refreshBefore: refreshBefore(existing), cursor: watermark(state), truncated: false, deliveryStatus };
        }
        const record: WebhookSubscription = { id, principal, url, name: type.name, secret, expiresAt, subscription };
        // A new subscription is counted against the limits before its endpoint is challenged, and starts from the
        // client's cursor: what it missed since is delivered first.
        const missed = await begin(type, record, request.cursor, request.maxAgeMs, () => verify(principal, url, id, secret));
        await store?.save(record);
        const started = states.get(record);
        return { id, refreshBefore: refreshBefore(record), cursor: started ? watermark(started) : missed.cursor, truncated: missed.truncated };
      });
      server.setRequestHandler("events/unsubscribe", { params: anything }, async (request, ctx: ServerContext) => {
        await load();
        const { type, id } = await keyed(request, ctx.http);
        const record = live.get(type.name)?.get(id);
        if (!record || expired(record)) throw new ProtocolError(NOT_FOUND, "NotFound", { kind: "subscription" });
        await forget(record);
        return {};
      });
    },
  };
}

// The body of a request, read no further than `limit` bytes. Undefined when it is longer.
async function read(request: Request, limit: number): Promise<string | undefined> {
  if (Number(request.headers.get("content-length")) > limit) return undefined;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if ((size += value.length) > limit) {
      await reader.cancel().catch(() => {});
      return undefined;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

/** One subscription's end of a receiver. */
interface Listener { secret: string; handle: (message: unknown) => void; seen: Set<string>; id?: string }

/**
 * The client's end of webhook delivery, as a function from a Request to a Response, for any server that speaks
 * fetch. Give it to createApps with the URL it is reached at, and mount it there: subscriptions then prefer webhook
 * delivery where a server offers it. It checks each delivery's signature and age, answers the challenge, drops what it
 * has seen, and hands the rest to the subscription it belongs to. `tolerance` is how old a delivery may be, in
 * seconds. Five minutes unless given.
 */
export function createReceiver({ tolerance = 5 * 60 }: { tolerance?: number } = {}): WebhookReceiver {
  // Subscriptions by the id the server derived, and those whose subscribe response has not said theirs yet.
  const routes = new Map<string, Set<Listener>>();
  const waiting = new Set<Listener>();
  // Subscriptions ended here, so a server still delivering to one is told to stop retrying.
  const ended = new Set<string>();
  const bounded = (set: Set<string>, value: string) => {
    set.add(value);
    const oldest = set.values().next();
    if (set.size > 1024 && !oldest.done) set.delete(oldest.value);
  };
  const reply = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: body === undefined ? {} : { "content-type": "application/json" } });
  const unroute = (listener: Listener) => {
    const route = listener.id === undefined ? undefined : routes.get(listener.id);
    if (!route || listener.id === undefined) return false;
    route.delete(listener);
    if (route.size) return false;
    routes.delete(listener.id);
    return true;
  };

  async function receive(request: Request): Promise<Response> {
    if (request.method !== "POST") return reply(405);
    const [id, timestamp, signature, subscription] = ["webhook-id", "webhook-timestamp", "webhook-signature", "x-mcp-subscription-id"].map(name => request.headers.get(name));
    if (!id || !timestamp || !signature || !subscription) return reply(400);
    if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) return reply(400);
    const body = await read(request, MAX_BODY);
    if (body === undefined) return reply(413);
    const signatures = signature.split(" ").filter(part => part.startsWith("v1,")).flatMap(part => { try { return [unbase64(part.slice(3))]; } catch { return []; } });
    // The listeners among these whose secret signed the delivery. Only they may hear it.
    const signers = async (listeners: Iterable<Listener>) => {
      const found: Listener[] = [];
      for (const listener of listeners) for (const bytes of signatures) if (await verifies(listener.secret, id, timestamp, body, bytes)) { found.push(listener); break; }
      return found;
    };
    const route = routes.get(subscription);
    const signed = await signers(route ?? []);
    // A subscription whose subscribe response has not arrived can answer a challenge, but is not routed to by what a
    // delivery says: the server tries its events again once the response has bound it.
    const pending = signed.length ? [] : await signers(waiting);
    if (!signed.length && !pending.length) return reply(!route && ended.has(subscription) ? 410 : 401);
    let message: { type?: unknown; challenge?: unknown } | null;
    try { message = JSON.parse(body); } catch { return reply(400); }
    if (message?.type === "verification") return reply(200, { challenge: message.challenge });
    if (!signed.length) return reply(503);
    for (const listener of signed) {
      if (listener.seen.has(id)) continue;
      bounded(listener.seen, id);
      listener.handle(message);
    }
    return reply(204);
  }

  return Object.assign(receive, {
    listen(handle: (message: unknown) => void) {
      const listener: Listener = { secret: `whsec_${base64(random(32))}`, handle, seen: new Set() };
      waiting.add(listener);
      return {
        secret: listener.secret,
        // Routes the subscription's deliveries here, by the id its subscribe response gave.
        bind(id: string) {
          if (listener.id === id) return;
          if (listener.id) unroute(listener);
          waiting.delete(listener);
          listener.id = id;
          let route = routes.get(id);
          if (!route) routes.set(id, route = new Set());
          route.add(listener);
        },
        // Whether this was the last listener of its subscription, which the server can then be told to stop.
        close() {
          waiting.delete(listener);
          if (!listener.id || !unroute(listener)) return false;
          bounded(ended, listener.id);
          return true;
        },
      };
    },
  });
}

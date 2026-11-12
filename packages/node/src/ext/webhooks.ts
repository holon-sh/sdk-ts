// Webhook delivery of MCP Events, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#webhook-based-delivery
// This is the server side: the webhook delivery mode createEvents adds when given a webhookTtl. Deliveries are signed by
// the Standard Webhooks library. Nothing here needs a Node module until it sends: a server is evaluated for its
// contract where node:crypto and its neighbours are not there. The client side, a receiver, waits for a Holon app to be
// able to serve one.
import { ProtocolError, ProtocolErrorCode } from "@modelcontextprotocol/server";
import type { Server, ServerContext, StandardSchemaV1 } from "@modelcontextprotocol/server";
import { Webhook } from "standardwebhooks";
import { getContext, type Principal } from "../context.js";
import type { EventError, EventOccurrence, EventTypeState, Internals, Owed, SubscriptionContext } from "./events.js";

/** A webhook subscription as the server keeps it, in memory. */
interface WebhookSubscription {
  /** Derived from the principal, callback URL, event name and arguments, which together are the subscription. */
  id: string;
  url: string;
  name: string;
  secret: string;
  /** The secret a refresh replaced, which still signs deliveries until `until`. */
  previous?: { secret: string; until: number };
  /** When the subscription lapses unless refreshed, in milliseconds since the epoch. */
  expiresAt: number;
  /** The id again, the subscription's checked arguments, and the caller match, transform and authorize are given. */
  subscription: { id: string; arguments: unknown; context: SubscriptionContext };
}
/** How webhook delivery runs: createEvents' `webhook` option. Its `webhookTtl` turns it on and caps grants. */
export interface WebhookOptions {
  /** For tests only: accepts http callbacks and callbacks at private addresses, such as a receiver on localhost. */
  allowInsecureLocalCallbacksForTesting?: boolean;
}

const INVALID_PARAMS = ProtocolErrorCode.InvalidParams;
const INTERNAL_ERROR = ProtocolErrorCode.InternalError;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
const FORBIDDEN = -32024;
const RESOURCE_EXHAUSTED = -32025;
const CALLBACK_ENDPOINT_ERROR = -32027;
// A body over this is refused by many receivers, so the sketch asks servers to stay under it.
const MAX_BODY = 256 * 1024;
// Old and new secrets both sign deliveries this long after a refresh changes the secret, so in-flight ones verify.
const ROTATION_GRACE = 5 * 60_000;
// The shortest lifetime granted, unless the cap is shorter, so clients do not refresh too often.
const MIN_TTL = 60_000;
// Each event is sent this many times at most, the first retry after BACKOFF and each later one five times longer:
// about thirteen minutes in all, within the sketch's suggestion.
const ATTEMPTS = 5;
const BACKOFF = 5000;
// How long a delivery has, from connecting to its answer, as the sketch suggests.
const TIMEOUT = 5000;
// How many events may be in flight to one subscription, beyond which the client is told of a gap.
const MAX_PENDING = 1000;
// How many deliveries run to one endpoint at once.
const CONCURRENCY = 4;
// A URL whose challenge failed is not challenged again for this long, and a host at most this often.
const FAILED_CHALLENGE = 10 * 60_000;
const VERIFICATIONS = { window: 60_000, max: 10 };
// How many hosts one principal may have challenged for the first time in a window.
const PROBES = { window: 10 * 60_000, max: 5 };
// Re-checks of access that fail this many times in a row end a subscription.
const UNANSWERED = 3;

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
const random = (bytes: number) => crypto.getRandomValues(new Uint8Array(bytes));
const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");

// A Standard Webhooks symmetric secret: whsec_ and the base64 of 24 to 64 random bytes.
function isSecret(secret: unknown): secret is string {
  const match = typeof secret === "string" ? /^whsec_([A-Za-z0-9+/]+={0,2})$/.exec(secret) : null;
  if (!match?.[1]) return false;
  try {
    const { length } = atob(match[1]);
    return length >= 24 && length <= 64;
  } catch { return false; }
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

/** How a POST to a callback went: `ok` and the start of the answer's `body`, or the sketch's category of `error`. */
interface Posted { ok?: boolean; status?: number; body?: string; error?: string }

// The sketch's lastError category for a POST that got no answer.
function category(error: unknown): string {
  const cause = (error as { cause?: { code?: string } } | undefined)?.cause;
  const name = (error as Error | undefined)?.name;
  if (name === "TimeoutError" || name === "AbortError" || /TIMEOUT/.test(cause?.code ?? "")) return "timeout";
  if (/TLS|SSL|CERT|SELF_SIGNED|UNABLE_TO|DEPTH_ZERO/.test(cause?.code ?? "")) return "tls_error";
  return "connection_refused";
}

/**
 * POSTs a signed body to a callback and says how it went. It connects only to globally reachable addresses, checked
 * when each connection is made, after the name is resolved, so a name that resolves to a private address later cannot
 * be used to reach one; files' fetch does this, and is loaded when first needed, since it needs Node. Redirects are
 * not followed, and the whole exchange has `timeout` milliseconds, so an endpoint that answers slowly cannot hold it
 * open. Only the start of an answer is read, which a challenge's echo fits in.
 */
async function post(url: string, headers: Record<string, string>, body: string, { timeout, local }: { timeout: number; local: boolean }): Promise<Posted> {
  try {
    const send = local ? fetch : (await import("#platform")).fetchGlobal;
    const response = await send(url, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body, redirect: "manual", signal: AbortSignal.timeout(timeout) });
    const { status } = response;
    const ok = status >= 200 && status < 300;
    let text = "";
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (let read = await reader.read(); !read.done && text.length < 4096; read = await reader.read()) text += decoder.decode(read.value, { stream: true });
      await reader.cancel().catch(() => {});
    }
    return { ok, status, body: text.slice(0, 4096), ...(!ok && { error: status >= 500 ? "http_5xx" : "http_4xx" }) };
  } catch (error) {
    // A header fetch will not send, such as an eventId outside Latin-1, fails here too.
    return { error: category(error) };
  }
}

/** A message waiting to be sent to a subscription's callback: an event, or a control envelope. */
interface Entry { state: State; id: string; tries: number; body(): string; event?: EventOccurrence; cursor?: string | null | undefined; settled?: boolean }
/** What delivering to one subscription has come to. */
interface State {
  type: EventTypeState;
  opened: { close(): void };
  queue: Entry[];
  held: Entry[];
  floor: string | null | undefined;
  gap: boolean;
  unknown: number;
  lastDeliveryAt?: string;
  lastError?: string | null;
  failedSince?: string | undefined;
}
/** Where a callback is reached, and how deliveries to it are signed. */
type Callback = Pick<WebhookSubscription, "id" | "url" | "secret" | "previous">;

/**
 * The webhook delivery mode, which createEvents adds when given a webhookTtl, the `ttl` here. Access is checked again
 * every `heartbeat`, as push streams check it. It serves
 * events/subscribe and events/unsubscribe to authenticated callers, verifies each callback by a challenge before
 * delivering to it, signs each delivery per Standard Webhooks with the client's secret, retries failed ones, and lets
 * subscriptions lapse when not refreshed.
 */
export function webhooks({ ttl, heartbeat, allowInsecureLocalCallbacksForTesting = false }: WebhookOptions & { ttl: number; heartbeat: number }): (server: Server, internals: Internals) => void {
  const local = allowInsecureLocalCallbacksForTesting === true;
  // Subscriptions being delivered to, by event name, then id; and what delivering to each has come to, which is kept
  // in memory only, lost on restart and begun again.
  const live = new Map<string, Map<string, WebhookSubscription>>();
  const states = new WeakMap<WebhookSubscription, State>();
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

  const quietly = (promise: unknown) => void Promise.resolve(promise).catch(() => {});
  const owner = (principal: Principal, url: string) => canonical([principal.issuer, principal.subject, url]);
  const endpointError = (reason: string | undefined) => new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason });
  const expired = (record: WebhookSubscription) => record.expiresAt <= Date.now();
  const refreshBefore = (record: WebhookSubscription) => new Date(record.expiresAt).toISOString();

  // Stops delivering to a subscription and lets go of its place among its type's subscriptions. A newer subscription
  // with the same id is not this one's to remove.
  const forget = async (record: WebhookSubscription) => {
    const state = states.get(record);
    states.delete(record);
    state?.opened.close();
    const records = live.get(record.name);
    if (records?.get(record.id) !== record) return;
    records.delete(record.id);
  };

  // The safe-to-persist cursor: every event at or before it has been acknowledged or given up on.
  const watermark = (state: State) => state.queue.length ? state.floor ?? null : internals.position(state.type);

  // A few deliveries run to one endpoint at a time, so a slow or flooded one holds neither connections nor the rest.
  const slot = async (url: string) => {
    const { origin } = new URL(url);
    let endpoint = endpoints.get(origin);
    if (!endpoint) endpoints.set(origin, endpoint = { running: 0, waiting: [] });
    const current = endpoint;
    if (current.running < CONCURRENCY) current.running++;
    else await new Promise<void>(resolve => current.waiting.push(resolve));
    return () => {
      const next = current.waiting.shift();
      if (next) return next();
      if (--current.running === 0) endpoints.delete(origin);
    };
  };

  const send = async (record: Callback, id: string, body: string) => {
    const at = new Date();
    const timestamp = Math.floor(at.getTime() / 1000);
    const secrets = [record.secret, ...(record.previous && record.previous.until > Date.now() ? [record.previous.secret] : [])];
    // While a refresh's new secret settles in, both sign, as Standard Webhooks allows.
    const signatures = secrets.map(secret => new Webhook(secret).sign(id, at, body));
    const release = await slot(record.url);
    try {
      return await post(record.url, { "webhook-id": id, "webhook-timestamp": String(timestamp), "webhook-signature": signatures.join(" "), "X-MCP-Subscription-Id": record.id }, body, { timeout: TIMEOUT, local });
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

  // What the subscription's refresh reports of its deliveries.
  const outcome = (state: State, result: Posted) => {
    const now = new Date().toISOString();
    if (result.ok) Object.assign(state, { lastDeliveryAt: now, lastError: null, failedSince: undefined });
    else Object.assign(state, { lastError: result.error, failedSince: state.failedSince ?? now });
  };

  // Each message is retried on its own, with backoff, until it is acknowledged, refused for good, or out of attempts.
  // While the caller's access is not known it waits, without spending its attempts.
  const attempt = async (record: WebhookSubscription, entry: Entry): Promise<void> => {
    const { state } = entry;
    // A message of a subscription since ended, or made again, is not sent.
    if (states.get(record) !== state) return;
    if (expired(record)) return void (entry.event && settle(record, entry));
    if (state.unknown) return void state.held.push(entry);
    let body: string | undefined;
    try { body = entry.body(); } catch { body = undefined; }
    // A body that cannot be made, or one too large for receivers, is given up on, as a receiver's 413 would be.
    if (body === undefined || encoder.encode(body).length > MAX_BODY) return void (entry.event && settle(record, entry));
    const result = await send(record, entry.id, body);
    if (states.get(record) !== state) return;
    // A receiver declining an event (410) or refusing its size (413) says nothing about the subscription, and is not retried.
    const declined = result.status === 410 || result.status === 413;
    if (!declined) outcome(state, result);
    if (result.ok || declined || ++entry.tries >= ATTEMPTS) return void (entry.event && settle(record, entry));
    if (state.unknown) return void state.held.push(entry);
    setTimeout(() => quietly(attempt(record, entry)), BACKOFF * 5 ** (entry.tries - 1)).unref?.();
  };

  const enqueue = (record: WebhookSubscription, event: EventOccurrence) => {
    const state = states.get(record);
    if (!state) return;
    // Beyond what may be in flight, events are skipped, and the client is told of the gap.
    if (state.queue.length >= MAX_PENDING) return void (state.gap = true);
    if (state.queue.some(entry => entry.id === event.eventId)) return;
    const entry: Entry = { state, id: event.eventId, event, cursor: event.cursor, tries: 0, body: () => JSON.stringify({ ...event, cursor: state.queue[0] === entry ? entry.cursor : state.floor }) };
    state.queue.push(entry);
    quietly(attempt(record, entry));
  };

  // Begins delivering to a subscription from a cursor: it takes its place among its type's subscriptions, counted
  // against the limits, with the type's onSubscribe run; `ready` runs once it has; and it is sent what it missed
  // since the cursor first. An end that arrives meanwhile is kept, and once setup is done the subscription ends with
  // it, having delivered nothing.
  const begin = async (type: EventTypeState, record: WebhookSubscription, cursor: string | null | undefined, maxAgeMs: number | undefined, ready: () => Promise<void>) => {
    let ending: EventError | undefined;
    const end = (error: EventError) => {
      if (states.has(record)) quietly(terminate(record, error));
      else ending ??= error;
    };
    const opened = await internals.open(type, { id: record.id, delivery: "webhook", arguments: record.subscription.arguments, context: record.subscription.context }, end);
    let missed: Owed;
    try {
      await ready();
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
    const state: State = { type, opened, queue: [], held: [], floor: missed.start, gap: false, unknown: 0 };
    states.set(record, state);
    let records = live.get(record.name);
    if (!records) live.set(record.name, records = new Map());
    const prior = records.get(record.id);
    records.set(record.id, record);
    if (prior && prior !== record) quietly(forget(prior));
    for (const event of missed.events) enqueue(record, event);
    return missed;
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
  };

  // Expired subscriptions and stale verifications are let go of now and then, without keeping the process alive.
  const sweep = () => {
    const now = Date.now();
    for (const records of live.values()) for (const record of records.values()) if (expired(record)) quietly(forget(record));
    for (const [key, until] of verified) if (until <= now) verified.delete(key);
    for (const [url, { until }] of failed) if (until <= now) failed.delete(url);
    for (const [host, times] of challenged) if ((times.at(-1) ?? 0) <= now - VERIFICATIONS.window) challenged.delete(host);
    for (const [who, hosts] of probed) if ([...hosts.values()].every(at => at <= now - PROBES.window)) probed.delete(who);
  };

  // Access is checked again every `heartbeat` milliseconds, so a subscription whose caller lost it stops, whether or
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

  // Expiry and access are checked from the first time a server is served, without keeping the process alive.
  let started = false;
  const start = (given: Internals) => {
    internals = given;
    if (started) return;
    started = true;
    setInterval(sweep, 60_000).unref?.();
    setInterval(() => quietly(recheck()), heartbeat).unref?.();
  };

  // The endpoint proves it wants deliveries by echoing a challenge, signed like any delivery. A URL whose challenge
  // failed is not challenged again for a while, and a host only so often, so subscribing cannot be used to make the
  // server POST wherever a caller likes.
  const verify = async (principal: Principal, url: string, id: string, secret: string) => {
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
    verified.set(key, Date.now() + Math.max(ttl, 24 * 60 * 60_000));
  };

  // The subscription a request names, checked as the events of every mode are, with the type's authorization. Its
  // id is made from the key the type gives the caller, event and arguments, and the callback URL. A caller with a
  // principal always has that key.
  const keyed = async (request: WebhookRequest, context: SubscriptionContext) => {
    const { principal } = getContext(context);
    if (!principal) throw new ProtocolError(FORBIDDEN, "Forbidden", { reason: "Webhook delivery needs an authenticated principal." });
    const url = request.delivery?.url;
    let parsed: URL | undefined;
    try { parsed = new URL(String(url)); } catch {}
    if (typeof url !== "string" || !parsed || parsed.protocol !== "https:" && !(local && parsed.protocol === "http:") || parsed.username || parsed.password)
      throw new ProtocolError(INVALID_PARAMS, "delivery.url must be an https URL.");
    const { type, subscription } = await internals.subscription(request, context, "webhook");
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify([subscription.lease, url])));
    const id = `sub_${hex(digest).slice(0, 32)}`;
    return { type, principal, url, id, subscription: { id, arguments: subscription.arguments, context: subscription.context } };
  };

  // The granted lifetime: the client's suggestion within the server's floor and cap. A request for no expiry, which
  // needs storage the server does not have, is granted the cap.
  const grant = (suggested: unknown) => Math.max(Math.min(MIN_TTL, ttl), Math.min(typeof suggested === "number" && suggested > 0 ? suggested : ttl, ttl));

  return (server, given) => {
    start(given);
    for (const type of internals.types.values()) attach(type);
    server.setRequestHandler("events/subscribe", { params: anything }, async (request, ctx: ServerContext) => {
      if (request.delivery?.mode !== undefined && request.delivery.mode !== "webhook") throw new ProtocolError(INVALID_PARAMS, "delivery.mode must be webhook.");
      const secret = request.delivery?.secret;
      if (!isSecret(secret)) throw new ProtocolError(INVALID_PARAMS, "delivery.secret must be whsec_ and the base64 of 24 to 64 bytes.");
      const { type, subscription, principal, url, id } = await keyed(request, ctx.http);
      attach(type);
      const expiresAt = Date.now() + grant(request.ttlMs);
      const existing = live.get(type.name)?.get(id);
      const state = existing && states.get(existing);
      if (existing && state?.type === type && !expired(existing)) {
        // A refresh: the TTL is granted again, and a new secret replaces the old. Delivery is never suspended.
        const deliveryStatus = { active: true, lastDeliveryAt: state.lastDeliveryAt ?? null, lastError: state.lastError ?? null, ...(state.failedSince && { failedSince: state.failedSince }) };
        Object.assign(existing, {
          expiresAt,
          subscription,
          ...(existing.secret !== secret && { secret, previous: { secret: existing.secret, until: Date.now() + ROTATION_GRACE } }),
        });
        return { id, refreshBefore: refreshBefore(existing), cursor: watermark(state), truncated: false, deliveryStatus };
      }
      const record: WebhookSubscription = { id, url, name: type.name, secret, expiresAt, subscription };
      // A new subscription is counted against the limits before its endpoint is challenged, and starts from the
      // client's cursor: what it missed since is delivered first.
      const missed = await begin(type, record, request.cursor, request.maxAgeMs, () => verify(principal, url, id, secret));
      const started = states.get(record);
      return { id, refreshBefore: refreshBefore(record), cursor: started ? watermark(started) : missed.cursor, truncated: missed.truncated };
    });
    server.setRequestHandler("events/unsubscribe", { params: anything }, async (request, ctx: ServerContext) => {
      const { type, id } = await keyed(request, ctx.http);
      const record = live.get(type.name)?.get(id);
      if (!record || expired(record)) throw new ProtocolError(NOT_FOUND, "NotFound", { kind: "subscription" });
      await forget(record);
      return {};
    });
  };
}

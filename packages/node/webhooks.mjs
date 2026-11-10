// Webhook delivery of MCP Events, both sides, as the Triggers & Events Working Group's design sketch defines it:
// https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#webhook-based-delivery
// The server side is a delivery mode for createEvents. The client side is a receiver an application mounts at its
// callback URL, which the runtime's subscribe hands deliveries from. Nothing here needs a Node module until it sends:
// a server is evaluated for its contract where node:crypto and its neighbours are not there.
import { ProtocolError } from "@modelcontextprotocol/server";
import { getContext } from "./context.mjs";

const INVALID_PARAMS = -32602;
// The sketch's general-purpose codes, provisional until the specification allocates them.
const NOT_FOUND = -32023;
const FORBIDDEN = -32024;
const CALLBACK_ENDPOINT_ERROR = -32027;
// A body over this is refused by many receivers, so the sketch asks servers to stay under it.
const MAX_BODY = 256 * 1024;
// Old and new secrets both sign deliveries this long after a refresh changes the secret, so in-flight ones verify.
const ROTATION_GRACE = 5 * 60_000;
// A subscription whose deliveries fail this often over this window, with at least this many attempts, is suspended.
const SUSPEND = { window: 60 * 60_000, attempts: 100, rate: 0.95 };
// Requests are checked by their handlers, against the sketch.
const anything = { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: value ?? {} }) } };

const encoder = new TextEncoder();
const base64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unbase64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const random = bytes => crypto.getRandomValues(new Uint8Array(bytes));
const hex = bytes => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");

// A Standard Webhooks symmetric secret: whsec_ and the base64 of 24 to 64 random bytes.
function secretBytes(secret) {
  const match = typeof secret === "string" && /^whsec_([A-Za-z0-9+/]+={0,2})$/.exec(secret);
  if (!match) return undefined;
  try {
    const bytes = unbase64(match[1]);
    return bytes.length >= 24 && bytes.length <= 64 ? bytes : undefined;
  } catch { return undefined; }
}

// HMAC-SHA256 of `id.timestamp.body` under the secret, the signature Standard Webhooks defines.
async function hmac(secret, id, timestamp, body, signature) {
  const key = await crypto.subtle.importKey("raw", secretBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, [signature ? "verify" : "sign"]);
  const signed = encoder.encode(`${id}.${timestamp}.${body}`);
  return signature ? crypto.subtle.verify("HMAC", key, signature, signed) : base64(await crypto.subtle.sign("HMAC", key, signed));
}

// JSON with object keys in order, so arguments that are equal give the same subscription.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

// Addresses that are not globally routable, from the IANA special-purpose registries. A callback never reaches them.
const PRIVATE = {
  ipv4: ["0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/3"],
  ipv6: ["::/128", "::1/128", "::ffff:0:0/96", "64:ff9b::/96", "64:ff9b:1::/48", "100::/64", "2001::/23", "2001:db8::/32", "2002::/16", "fc00::/7", "fe80::/10", "ff00::/8"],
};
let blocked;

/**
 * POSTs a signed body to a callback and says how it went: `ok`, the HTTP `status`, the `body` when it is small, or the
 * sketch's category of `error`. The address is checked when the request connects, after the name is resolved, so a
 * name that resolves to a private address later cannot be used to reach one. Redirects are not followed.
 */
async function post(url, headers, body, { timeout, local }) {
  const target = new URL(url);
  const [{ request }, dns, { BlockList, isIP }] = await Promise.all([import(target.protocol === "https:" ? "node:https" : "node:http"), import("node:dns"), import("node:net")]);
  if (!blocked) {
    blocked = new BlockList();
    for (const [type, ranges] of Object.entries(PRIVATE)) for (const range of ranges) {
      const [address, prefix] = range.split("/");
      blocked.addSubnet(address, Number(prefix), type);
    }
  }
  const reachable = address => local || !blocked.check(address, isIP(address) === 6 ? "ipv6" : "ipv4");
  const host = target.hostname.replace(/^\[|\]$/g, "");
  // A literal address is connected to without a lookup, so it is checked here.
  if (isIP(host) && !reachable(host)) return { error: "connection_refused" };
  const lookup = (hostname, options, callback) => dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error);
    const allowed = addresses.filter(({ address }) => reachable(address));
    if (!allowed.length) return callback(Object.assign(new Error(`${hostname} resolves to no public address`), { code: "ECONNREFUSED" }));
    if (options.all) callback(null, allowed);
    else callback(null, allowed[0].address, allowed[0].family);
  });
  const bytes = encoder.encode(body);
  return new Promise(resolve => {
    const outgoing = request(target, { method: "POST", agent: false, lookup, timeout, headers: { ...headers, "content-type": "application/json", "content-length": bytes.length } }, response => {
      const chunks = [];
      let size = 0;
      response.on("data", chunk => { if ((size += chunk.length) <= 4096) chunks.push(chunk); });
      response.on("end", () => {
        const status = response.statusCode;
        const ok = status >= 200 && status < 300;
        resolve({ ok, status, body: Buffer.concat(chunks).toString(), ...(!ok && { error: status >= 500 ? "http_5xx" : "http_4xx" }) });
      });
      response.on("error", () => resolve({ error: "connection_refused" }));
    });
    outgoing.on("timeout", () => outgoing.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    outgoing.on("error", error => resolve({ error: /TIMEDOUT/.test(error.code) ? "timeout" : /TLS|SSL|CERT|SELF_SIGNED|UNABLE_TO|DEPTH_ZERO/.test(error.code ?? "") ? "tls_error" : "connection_refused" }));
    outgoing.end(bytes);
  });
}

/**
 * Webhook delivery for createEvents: events/subscribe and events/unsubscribe, signed POSTs to each subscription's
 * callback with retries, endpoint verification, and expiry of subscriptions their clients stop refreshing.
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
  allowInsecureLocalCallbacksForTesting = false,
} = {}) {
  // A subscription that never expires is never refreshed, so it must outlive the process: that needs a store.
  if (ttl === null && !store) throw new Error("Webhook subscriptions without expiry need a store that keeps them across restarts.");
  const local = allowInsecureLocalCallbacksForTesting === true;
  // Subscriptions by event name, then id. A store keeps them across restarts and is read once, when serving starts.
  const live = new Map();
  // What delivering to a subscription has come to, kept in memory only: lost on restart, rebuilt as events arrive.
  const states = new Map();
  // Callback URLs each principal has proved it receives at, so their next subscriptions are not challenged again.
  const verified = new Map();
  let internals;
  let loaded;

  const subscriptions = name => live.get(name) ?? live.set(name, new Map()).get(name);
  const principalOf = context => {
    const { principal } = getContext(context);
    return principal && { issuer: principal.issuer, subject: principal.subject };
  };
  const owner = (principal, url) => canonical([principal.issuer, principal.subject, url]);

  const remember = record => subscriptions(record.name).set(record.id, record);
  const forget = async record => {
    live.get(record.name)?.delete(record.id);
    states.delete(record.id);
    await store?.remove(record.id);
  };
  const expired = record => record.expiresAt !== null && record.expiresAt <= Date.now();

  const state = record => {
    let current = states.get(record.id);
    if (!current) {
      // A subscription read from a store starts from where its event type is now.
      const type = internals.types.get(record.name);
      current = { queue: [], floor: type && internals.position(type), active: true, outcomes: [], skipped: false, gap: false, checked: Date.now(), checking: Promise.resolve(true) };
      states.set(record.id, current);
    }
    return current;
  };

  // The safe-to-persist cursor: every event at or before it has been acknowledged or given up on.
  const watermark = (record, type) => {
    const { queue, floor } = state(record);
    return queue.length ? floor : internals.position(type);
  };

  const send = async (record, id, body) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const secrets = [record.secret, ...(record.previous && record.previous.until > Date.now() ? [record.previous.secret] : [])];
    const signatures = await Promise.all(secrets.map(async secret => `v1,${await hmac(secret, id, timestamp, body)}`));
    return post(record.url, { "webhook-id": id, "webhook-timestamp": String(timestamp), "webhook-signature": signatures.join(" "), "X-MCP-Subscription-Id": record.id }, body, { timeout, local });
  };
  const envelope = (record, body) => send(record, `msg_${body.type}_${hex(random(12))}`, JSON.stringify(body));

  // Ends a subscription the server no longer serves, telling its callback why.
  const terminate = async (record, error) => {
    await forget(record);
    await envelope(record, { type: "terminated", error: { code: error.code, message: error.message, ...(error.data !== undefined && { data: error.data }) } }).catch(() => {});
  };

  const settle = (record, entry) => {
    entry.settled = true;
    const current = state(record);
    while (current.queue[0]?.settled) current.floor = current.queue.shift().cursor;
    // Events dropped while too many were in flight are a gap the client hears of once the rest are through.
    if (!current.queue.length && current.gap) {
      current.gap = false;
      const type = internals.types.get(record.name);
      void envelope(record, { type: "gap", cursor: watermark(record, type) }).catch(() => {});
    }
  };

  const outcome = (record, result) => {
    const current = state(record);
    const now = Date.now();
    current.outcomes.push({ at: now, ok: result.ok });
    while (current.outcomes[0].at < now - SUSPEND.window || current.outcomes.length > SUSPEND.attempts * 10) current.outcomes.shift();
    if (result.ok) Object.assign(current, { lastDeliveryAt: new Date(now).toISOString(), lastError: null, failedSince: undefined });
    else Object.assign(current, { lastError: result.error, failedSince: current.failedSince ?? new Date(now).toISOString() });
    const failures = current.outcomes.filter(({ ok }) => !ok).length;
    if (current.active && current.outcomes.length >= SUSPEND.attempts && failures / current.outcomes.length > SUSPEND.rate) {
      current.active = false;
      // A subscription without expiry has no refresh to bring it back, so it is dropped.
      if (record.expiresAt === null) void terminate(record, new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason: result.error }));
    }
  };

  // Each event is retried on its own, with backoff, until it is acknowledged, refused for good, or out of attempts.
  const attempt = async (record, entry, tries = 0) => {
    const current = states.get(record.id);
    if (!current || expired(record)) return current && settle(record, entry);
    if (!current.active) return void (entry.held = true);
    const body = JSON.stringify({ ...entry.event, cursor: current.queue[0] === entry ? entry.cursor : current.floor });
    // A body too large for receivers is given up on, as a receiver's 413 would be.
    if (body.length > MAX_BODY) return settle(record, entry);
    const result = await send(record, entry.event.eventId, body);
    if (!states.has(record.id)) return;
    outcome(record, result);
    // 410 is a receiver declining the event, and 413 one refusing its size: neither is retried.
    if (result.ok || result.status === 410 || result.status === 413 || tries + 1 >= attempts) return settle(record, entry);
    if (!current.active) return void (entry.held = true);
    setTimeout(() => void attempt(record, entry, tries + 1), backoff * 5 ** tries).unref?.();
  };

  const enqueue = (record, event) => {
    const current = state(record);
    // Events while delivery is suspended, or beyond what may be in flight, are skipped, and the client told so.
    if (!current.active) return void (current.skipped = true);
    if (current.queue.length >= maxPending) return void (current.gap = true);
    if (current.queue.some(entry => entry.cursor === event.cursor)) return;
    const entry = { cursor: event.cursor, event, settled: false };
    // Queued at once, so the cursor a refresh returns stays behind it, and sent once the subscription is known to hold.
    current.queue.push(entry);
    void current.checking.then(holds => holds && attempt(record, entry));
  };

  // Each emitted event goes to the live subscriptions of its type whose arguments match it.
  const attached = new WeakSet();
  const attach = type => {
    if (attached.has(type)) return;
    attached.add(type);
    type.sinks.add(kept => {
      for (const record of [...(live.get(type.name)?.values() ?? [])]) {
        if (expired(record)) { void forget(record); continue; }
        const event = internals.shape(type, kept, record.subscription);
        if (event) deliver(record, event);
      }
    });
  };

  // A subscription is checked again now and then, so one its principal may no longer hold is ended.
  const deliver = (record, event) => {
    const current = state(record);
    if (Date.now() - current.checked >= reverify) {
      current.checked = Date.now();
      current.checking = internals.subscription({ name: record.name, arguments: record.subscription.arguments }, record.subscription.context)
        .then(() => true, error => { void terminate(record, error); return false; });
    }
    enqueue(record, event);
  };

  // The endpoint proves it wants deliveries by echoing a challenge, signed like any delivery.
  const verify = async (principal, url, id, secret) => {
    const key = owner(principal, url);
    if ((verified.get(key) ?? 0) > Date.now()) return;
    const challenge = hex(random(24));
    const result = await envelope({ id, url, secret }, { type: "verification", challenge });
    let echoed;
    try { echoed = JSON.parse(result.body).challenge; } catch {}
    if (!result.ok || !equal(echoed, challenge)) throw new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason: result.ok ? "challenge_failed" : result.error });
    verified.set(key, Date.now() + Math.max(ttl ?? 0, 24 * 60 * 60_000));
  };

  // The subscription key a request names, as the sketch defines it, and the id derived from it.
  const keyed = async (request, context) => {
    const principal = principalOf(context);
    if (!principal) throw new ProtocolError(FORBIDDEN, "Forbidden", { reason: "Webhook delivery needs an authenticated principal." });
    const url = request.delivery?.url;
    let parsed;
    try { parsed = new URL(url); } catch {}
    if (!parsed || parsed.protocol !== "https:" && !(local && parsed.protocol === "http:") || parsed.username || parsed.password)
      throw new ProtocolError(INVALID_PARAMS, "delivery.url must be an https URL.");
    const checked = await internals.subscription(request, context);
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonical([principal.issuer, principal.subject, url, request.name, checked.subscription.arguments])));
    return { ...checked, principal, url, id: `sub_${hex(digest).slice(0, 32)}` };
  };

  // The granted lifetime: the client's suggestion within the server's floor and cap. No expiry only when both allow it.
  const grant = suggested => {
    if (suggested === null && ttl === null) return null;
    const cap = ttl ?? Infinity;
    const wanted = typeof suggested === "number" && suggested > 0 ? suggested : cap === Infinity ? 24 * 60 * 60_000 : cap;
    return Math.max(minTtl, Math.min(wanted, cap));
  };

  // Only what match and transform may read of the subscribing request is kept: never its token.
  const keep = context => {
    const authInfo = context?.authInfo;
    return authInfo && { authInfo: { clientId: authInfo.clientId, scopes: authInfo.scopes, ...(authInfo.extra && { extra: authInfo.extra }) } };
  };

  return {
    name: "webhook",
    serve(server, given) {
      internals = given;
      loaded ??= Promise.resolve(store?.load()).then(records => {
        // A kept subscription exists only because its endpoint was verified, so it is not challenged again.
        for (const record of records ?? []) if (!expired(record)) { remember(record); verified.set(owner(record.principal, record.url), Infinity); }
      });
      server.setRequestHandler("events/subscribe", { params: anything }, async (request, ctx) => {
        await loaded;
        if (request.delivery?.mode !== undefined && request.delivery.mode !== "webhook") throw new ProtocolError(INVALID_PARAMS, "delivery.mode must be webhook.");
        if (!secretBytes(request.delivery?.secret)) throw new ProtocolError(INVALID_PARAMS, "delivery.secret must be whsec_ and the base64 of 24 to 64 bytes.");
        const { type, subscription, principal, url, id } = await keyed(request, ctx.http);
        for (const known of internals.types.values()) attach(known);
        const granted = grant(request.ttlMs);
        const expiresAt = granted === null ? null : Date.now() + granted;
        const existing = live.get(type.name)?.get(id);
        if (existing && !expired(existing)) {
          // A refresh: the TTL is granted again, a new secret replaces the old, and suspended delivery resumes.
          const current = state(existing);
          const status = { active: current.active, lastDeliveryAt: current.lastDeliveryAt ?? null, lastError: current.lastError ?? null, ...(current.failedSince && { failedSince: current.failedSince }) };
          const truncated = current.skipped;
          Object.assign(existing, {
            expiresAt,
            subscription: { arguments: subscription.arguments, context: keep(subscription.context) },
            ...(existing.secret !== request.delivery.secret && { secret: request.delivery.secret, previous: { secret: existing.secret, until: Date.now() + ROTATION_GRACE } }),
          });
          await store?.save(existing);
          Object.assign(current, { active: true, skipped: false, checked: Date.now() });
          for (const entry of current.queue.filter(entry => entry.held)) { entry.held = false; void attempt(existing, entry); }
          return { id, refreshBefore: expiresAt === null ? null : new Date(expiresAt).toISOString(), cursor: watermark(existing, type), truncated, deliveryStatus: status };
        }
        if (existing) await forget(existing);
        await verify(principal, url, id, request.delivery.secret);
        const record = { id, principal, url, name: type.name, secret: request.delivery.secret, expiresAt, subscription: { arguments: subscription.arguments, context: keep(subscription.context) } };
        remember(record);
        await store?.save(record);
        // A new subscription starts from the client's cursor: what it missed since is delivered first.
        const missed = internals.since(type, record.subscription, request.cursor ?? null, request.maxAgeMs);
        const current = state(record);
        current.floor = missed.events.length ? request.cursor : missed.cursor;
        for (const event of missed.events) enqueue(record, event);
        return { id, refreshBefore: expiresAt === null ? null : new Date(expiresAt).toISOString(), cursor: watermark(record, type), truncated: missed.truncated };
      });
      server.setRequestHandler("events/unsubscribe", { params: anything }, async (request, ctx) => {
        await loaded;
        const { type, id } = await keyed(request, ctx.http);
        const record = live.get(type.name)?.get(id);
        if (!record || expired(record)) throw new ProtocolError(NOT_FOUND, "NotFound", { kind: "subscription" });
        await forget(record);
        return {};
      });
    },
  };
}
/**
 * The client's end of webhook delivery: a function from a callback's Request to its Response, for any server that
 * speaks fetch. It checks each delivery's signature and age, answers the challenge, drops what it has seen, and hands
 * the rest to the subscription it belongs to.
 */
export function createReceiver({ tolerance = 5 * 60 } = {}) {
  // Subscriptions by the id the server derived, and those waiting for the server to say theirs.
  const routes = new Map();
  const waiting = new Set();
  // Subscriptions ended here, so a server still delivering to one is told to stop retrying.
  const ended = new Set();
  const bounded = (set, value) => { set.add(value); if (set.size > 1024) set.delete(set.values().next().value); };
  const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: body === undefined ? {} : { "content-type": "application/json" } });

  const route = id => routes.get(id) ?? routes.set(id, { listeners: new Set(), seen: new Set() }).get(id);

  async function receive(request) {
    if (request.method !== "POST") return reply(405);
    const header = name => request.headers.get(name);
    const [id, timestamp, signature, subscription] = ["webhook-id", "webhook-timestamp", "webhook-signature", "x-mcp-subscription-id"].map(header);
    if (!id || !timestamp || !signature || !subscription) return reply(400);
    if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) return reply(400);
    if (Number(request.headers.get("content-length")) > 1024 * 1024) return reply(413);
    const body = await request.text();
    const signatures = signature.split(" ").filter(part => part.startsWith("v1,")).map(part => { try { return unbase64(part.slice(3)); } catch { return undefined; } }).filter(Boolean);
    // The secret is the subscription's, so a signature that verifies under it says whose delivery this is.
    const known = routes.get(subscription);
    let listener;
    for (const candidate of [...(known?.listeners ?? []), ...waiting]) {
      for (const bytes of signatures) if (await hmac(candidate.secret, id, timestamp, body, bytes)) { listener = candidate; break; }
      if (listener) break;
    }
    // An unknown id may be a subscription whose subscribe response has not arrived yet: the server tries again.
    if (!listener) return reply(known ? 401 : ended.has(subscription) ? 410 : 503);
    if (waiting.delete(listener)) { listener.id = subscription; route(subscription).listeners.add(listener); }
    let message;
    try { message = JSON.parse(body); } catch { return reply(400); }
    if (message?.type === "verification") return reply(200, { challenge: message.challenge });
    const { seen, listeners } = route(subscription);
    if (seen.has(id)) return reply(204);
    bounded(seen, id);
    for (const each of listeners) each.handle(message);
    return reply(204);
  }

  /** Not for applications: the runtime's subscribe listens for one subscription's deliveries. */
  receive.listen = handle => {
    const listener = { secret: `whsec_${base64(random(32))}`, handle };
    waiting.add(listener);
    return {
      secret: listener.secret,
      bind(id) {
        if (!waiting.delete(listener) && listener.id === id) return;
        listener.id = id;
        route(id).listeners.add(listener);
      },
      // Whether this was the last listener of its subscription, which the server can then be told to stop.
      close() {
        waiting.delete(listener);
        const current = listener.id && routes.get(listener.id);
        if (!current) return false;
        current.listeners.delete(listener);
        if (current.listeners.size) return false;
        routes.delete(listener.id);
        bounded(ended, listener.id);
        return true;
      },
    };
  };
  return receive;
}

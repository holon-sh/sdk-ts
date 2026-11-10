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
const RESOURCE_EXHAUSTED = -32025;
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

// Addresses that are not globally routable, from the IANA special-purpose registries, and IPv4-compatible IPv6. A
// callback never reaches them.
const PRIVATE = {
  ipv4: ["0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/3"],
  ipv6: ["::/96", "::ffff:0:0/96", "64:ff9b::/96", "64:ff9b:1::/48", "100::/64", "100:0:0:1::/64", "2001::/23", "2001:db8::/32", "2002::/16", "3fff::/20", "5f00::/16", "fc00::/7", "fe80::/10", "ff00::/8"],
};
let blocked;

/**
 * POSTs a signed body to a callback and says how it went: `ok`, the HTTP `status`, the start of the `body`, or the
 * sketch's category of `error`. The address is checked when the request connects, after the name is resolved, so a
 * name that resolves to a private address later cannot be used to reach one. Redirects are not followed, and the
 * whole exchange has `timeout` milliseconds, so an endpoint that answers slowly cannot hold it open.
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
    let outgoing;
    const done = result => {
      clearTimeout(deadline);
      outgoing?.destroy();
      resolve(result);
    };
    const deadline = setTimeout(() => done({ error: "timeout" }), timeout);
    deadline.unref?.();
    try {
      outgoing = request(target, { method: "POST", agent: false, lookup, headers: { ...headers, "content-type": "application/json", "content-length": bytes.length } }, response => {
        const status = response.statusCode;
        const ok = status >= 200 && status < 300;
        const chunks = [];
        let size = 0;
        // Only the start of an answer is kept, which a challenge's echo fits in, so the rest is not read.
        const finish = () => done({ ok, status, body: Buffer.concat(chunks).subarray(0, 4096).toString(), ...(!ok && { error: status >= 500 ? "http_5xx" : "http_4xx" }) });
        response.on("data", chunk => { chunks.push(chunk); if ((size += chunk.length) >= 4096) finish(); });
        response.on("end", finish);
        response.on("error", finish);
      });
    } catch {
      // A header Node will not send, such as an eventId outside Latin-1, fails here rather than on the wire.
      return done({ error: "connection_refused" });
    }
    outgoing.on("error", error => done({ error: /TLS|SSL|CERT|SELF_SIGNED|UNABLE_TO|DEPTH_ZERO/.test(error.code ?? "") ? "tls_error" : "connection_refused" }));
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
  maxSubscriptions = 100,
  concurrency = 4,
  allowInsecureLocalCallbacksForTesting = false,
} = {}) {
  // A subscription that never expires is never refreshed, so it must outlive the process: that needs a store.
  if (ttl === null && !store) throw new Error("Webhook subscriptions without expiry need a store that keeps them across restarts.");
  const local = allowInsecureLocalCallbacksForTesting === true;
  // Subscriptions by event name, then id. A store keeps them across restarts and is read once, when serving starts.
  const live = new Map();
  // What delivering to a subscription has come to, kept in memory only: lost on restart, rebuilt as events arrive.
  const states = new Map();
  // Callback URLs each principal has proved it receives at, so their next subscriptions are not challenged again; URLs
  // whose challenge failed; and when each host was challenged lately.
  const verified = new Map();
  const failed = new Map();
  const challenged = new Map();
  // Deliveries running to each endpoint, and those waiting for one of them to finish.
  const endpoints = new Map();
  let internals;
  let loaded;

  const quietly = promise => void Promise.resolve(promise).catch(() => {});
  const subscriptions = name => live.get(name) ?? live.set(name, new Map()).get(name);
  const principalOf = context => {
    const { principal } = getContext(context);
    return principal && { issuer: principal.issuer, subject: principal.subject };
  };
  const owner = (principal, url) => canonical([principal.issuer, principal.subject, url]);
  const endpointError = reason => new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason });
  const expired = record => record.expiresAt !== null && record.expiresAt <= Date.now();
  const refreshBefore = record => record.expiresAt === null ? null : new Date(record.expiresAt).toISOString();

  const remember = record => subscriptions(record.name).set(record.id, record);
  const forget = async record => {
    live.get(record.name)?.delete(record.id);
    states.delete(record.id);
    await store?.remove(record.id);
  };

  // Expired subscriptions and stale verifications are let go of now and then, without keeping the process alive.
  const sweep = () => {
    const now = Date.now();
    for (const records of live.values()) for (const record of records.values()) if (expired(record)) quietly(forget(record));
    for (const [key, until] of verified) if (until <= now) verified.delete(key);
    for (const [url, { until }] of failed) if (until <= now) failed.delete(url);
    for (const [host, times] of challenged) if (times.at(-1) <= now - VERIFICATIONS.window) challenged.delete(host);
  };

  const state = record => {
    let current = states.get(record.id);
    if (!current) {
      // A subscription read from a store starts from where its event type is now.
      const type = internals.types.get(record.name);
      current = { queue: [], held: [], floor: type && internals.position(type), active: true, outcomes: [], gap: false, checked: Date.now(), checking: Promise.resolve(true) };
      states.set(record.id, current);
    }
    return current;
  };

  // The safe-to-persist cursor: every event at or before it has been acknowledged or given up on.
  const watermark = (record, type) => {
    const { queue, floor } = state(record);
    return queue.length ? floor : internals.position(type);
  };

  // A few deliveries run to one endpoint at a time, so a slow or flooded one holds neither connections nor the rest.
  const slot = async url => {
    const { origin } = new URL(url);
    const endpoint = endpoints.get(origin) ?? endpoints.set(origin, { running: 0, waiting: [] }).get(origin);
    if (endpoint.running < concurrency) endpoint.running++;
    else await new Promise(resolve => endpoint.waiting.push(resolve));
    return () => {
      const next = endpoint.waiting.shift();
      if (next) return next();
      if (--endpoint.running === 0) endpoints.delete(origin);
    };
  };

  const send = async (record, id, body) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const secrets = [record.secret, ...(record.previous && record.previous.until > Date.now() ? [record.previous.secret] : [])];
    const signatures = await Promise.all(secrets.map(async secret => `v1,${await hmac(secret, id, timestamp, body)}`));
    const release = await slot(record.url);
    try {
      return await post(record.url, { "webhook-id": id, "webhook-timestamp": String(timestamp), "webhook-signature": signatures.join(" "), "X-MCP-Subscription-Id": record.id }, body, { timeout, local });
    } finally { release(); }
  };
  const control = type => `msg_${type}_${hex(random(12))}`;

  // Ends a subscription the server no longer serves, telling its callback why. It no longer exists, so this is sent once.
  const terminate = async (record, error) => {
    await forget(record).catch(() => {});
    const body = { type: "terminated", error: { code: error.code, message: error.message, ...(error.data !== undefined && { data: error.data }) } };
    await send(record, control("terminated"), JSON.stringify(body)).catch(() => {});
  };

  const settle = (record, entry) => {
    entry.settled = true;
    const current = entry.state;
    while (current.queue[0]?.settled) current.floor = current.queue.shift().cursor;
    // Events dropped while too many were in flight are a gap the client hears of once the rest are through.
    if (!current.queue.length && current.gap) {
      current.gap = false;
      const body = JSON.stringify({ type: "gap", cursor: watermark(record, internals.types.get(record.name)) });
      quietly(attempt(record, { state: current, id: control("gap"), tries: 0, body: () => body }));
    }
  };

  const outcome = (record, result) => {
    const current = states.get(record.id);
    const now = Date.now();
    current.outcomes.push({ at: now, ok: result.ok });
    while (current.outcomes[0].at < now - SUSPEND.window || current.outcomes.length > SUSPEND.attempts * 10) current.outcomes.shift();
    if (result.ok) Object.assign(current, { lastDeliveryAt: new Date(now).toISOString(), lastError: null, failedSince: undefined });
    else Object.assign(current, { lastError: result.error, failedSince: current.failedSince ?? new Date(now).toISOString() });
    const failures = current.outcomes.filter(({ ok }) => !ok).length;
    if (current.active && current.outcomes.length >= SUSPEND.attempts && failures / current.outcomes.length > SUSPEND.rate) {
      current.active = false;
      // A subscription without expiry has no refresh to bring it back, so it is dropped.
      if (record.expiresAt === null) quietly(terminate(record, endpointError(result.error)));
    }
  };

  // Each message is retried on its own, with backoff, until it is acknowledged, refused for good, or out of attempts.
  // While delivery is suspended it waits, without spending its attempts, for a refresh to resume it.
  const attempt = async (record, entry) => {
    const current = states.get(record.id);
    // A message of a subscription since made again belongs to the old one, which is gone.
    if (current !== entry.state) return;
    if (expired(record)) return entry.event && settle(record, entry);
    if (!current.active) return void current.held.push(entry);
    const body = entry.body();
    // A body too large for receivers is given up on, as a receiver's 413 would be.
    if (encoder.encode(body).length > MAX_BODY) return entry.event && settle(record, entry);
    const result = await send(record, entry.id, body);
    if (states.get(record.id) !== current) return;
    // A receiver declining an event (410) or refusing its size (413) says nothing about the subscription, and is not retried.
    const declined = result.status === 410 || result.status === 413;
    if (!declined) outcome(record, result);
    if (result.ok || declined || ++entry.tries >= attempts) return entry.event && settle(record, entry);
    if (!current.active) return void current.held.push(entry);
    setTimeout(() => quietly(attempt(record, entry)), backoff * 5 ** (entry.tries - 1)).unref?.();
  };

  const enqueue = (record, event) => {
    const current = state(record);
    // Beyond what may be in flight, events are skipped, and the client is told of the gap.
    if (current.queue.length >= maxPending) return void (current.gap = true);
    if (current.queue.some(entry => entry.cursor === event.cursor)) return;
    // Queued at once, so the cursor a refresh returns stays behind it, and sent once the subscription is known to hold.
    const entry = { state: current, id: event.eventId, event, cursor: event.cursor, tries: 0 };
    entry.body = () => JSON.stringify({ ...event, cursor: current.queue[0] === entry ? entry.cursor : current.floor });
    current.queue.push(entry);
    quietly(current.checking.then(holds => holds && attempt(record, entry)));
  };

  // A subscription is checked again now and then, so one its principal may no longer hold is ended.
  const deliver = (record, event) => {
    const current = state(record);
    if (Date.now() - current.checked >= reverify) {
      current.checked = Date.now();
      current.checking = internals.subscription({ name: record.name, arguments: record.subscription.arguments }, record.subscription.context)
        .then(() => true, error => { quietly(terminate(record, error)); return false; });
    }
    enqueue(record, event);
  };

  // Each emitted event goes to the live subscriptions of its type whose arguments match it.
  const attached = new WeakSet();
  const attach = type => {
    if (attached.has(type)) return;
    attached.add(type);
    type.sinks.add(kept => {
      for (const record of [...(live.get(type.name)?.values() ?? [])]) {
        if (expired(record)) { quietly(forget(record)); continue; }
        const event = internals.shape(type, kept, record.subscription);
        if (event) deliver(record, event);
      }
    });
  };

  // The endpoint proves it wants deliveries by echoing a challenge, signed like any delivery. A URL whose challenge
  // failed is not challenged again for a while, and a host only so often, so subscribing cannot be used to make the
  // server POST wherever a caller likes.
  const verify = async (principal, url, id, secret) => {
    const key = owner(principal, url);
    const now = Date.now();
    if ((verified.get(key) ?? 0) > now) return;
    const failure = failed.get(url);
    if (failure && failure.until > now) throw endpointError(failure.reason);
    const { host } = new URL(url);
    const recent = (challenged.get(host) ?? []).filter(at => at > now - VERIFICATIONS.window);
    if (recent.length >= VERIFICATIONS.max) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "verifications", max: VERIFICATIONS.max });
    challenged.set(host, [...recent, now]);
    const challenge = hex(random(24));
    const result = await send({ id, url, secret }, control("verification"), JSON.stringify({ type: "verification", challenge }));
    let echoed;
    try { echoed = JSON.parse(result.body).challenge; } catch {}
    if (!result.ok || !equal(echoed, challenge)) {
      const reason = result.ok ? "challenge_failed" : result.error;
      failed.set(url, { until: Date.now() + FAILED_CHALLENGE, reason });
      throw endpointError(reason);
    }
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

  const owned = principal => {
    let count = 0;
    for (const records of live.values()) for (const record of records.values())
      if (!expired(record) && record.principal.issuer === principal.issuer && record.principal.subject === principal.subject) count++;
    return count;
  };

  return {
    name: "webhook",
    serve(server, given) {
      internals = given;
      // Events reach kept subscriptions from the first time a server is served, before any client subscribes again.
      for (const type of internals.types.values()) attach(type);
      if (!loaded) {
        loaded = Promise.resolve().then(() => store?.load()).then(records => {
          // A kept subscription exists only because its endpoint was verified, so it is not challenged again.
          for (const record of records ?? []) if (!expired(record)) { remember(record); verified.set(owner(record.principal, record.url), Infinity); }
        });
        // A store that fails to load fails each subscribe and unsubscribe, which wait for it.
        loaded.catch(() => {});
        setInterval(sweep, 60_000).unref?.();
      }
      server.setRequestHandler("events/subscribe", { params: anything }, async (request, ctx) => {
        await loaded;
        if (request.delivery?.mode !== undefined && request.delivery.mode !== "webhook") throw new ProtocolError(INVALID_PARAMS, "delivery.mode must be webhook.");
        if (!secretBytes(request.delivery?.secret)) throw new ProtocolError(INVALID_PARAMS, "delivery.secret must be whsec_ and the base64 of 24 to 64 bytes.");
        const { type, subscription, principal, url, id } = await keyed(request, ctx.http);
        for (const known of internals.types.values()) attach(known);
        const granted = grant(request.ttlMs);
        const expiresAt = granted === null ? null : Date.now() + granted;
        const kept = { arguments: subscription.arguments, context: keep(subscription.context) };
        const existing = live.get(type.name)?.get(id);
        if (existing && !expired(existing)) {
          // A refresh: the TTL is granted again, a new secret replaces the old, and suspended delivery resumes.
          const current = state(existing);
          const deliveryStatus = { active: current.active, lastDeliveryAt: current.lastDeliveryAt ?? null, lastError: current.lastError ?? null, ...(current.failedSince && { failedSince: current.failedSince }) };
          Object.assign(existing, {
            expiresAt,
            subscription: kept,
            ...(existing.secret !== request.delivery.secret && { secret: request.delivery.secret, previous: { secret: existing.secret, until: Date.now() + ROTATION_GRACE } }),
          });
          await store?.save(existing);
          // Failures before the refresh do not count toward suspending it again.
          Object.assign(current, { active: true, outcomes: [], checked: Date.now() });
          for (const entry of current.held.splice(0)) quietly(attempt(existing, entry));
          return { id, refreshBefore: refreshBefore(existing), cursor: watermark(existing, type), truncated: false, deliveryStatus };
        }
        if (existing) await forget(existing);
        if (owned(principal) >= maxSubscriptions) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "subscriptions", max: maxSubscriptions });
        await verify(principal, url, id, request.delivery.secret);
        const record = { id, principal, url, name: type.name, secret: request.delivery.secret, expiresAt, subscription: kept };
        remember(record);
        await store?.save(record);
        // A new subscription starts from the client's cursor: what it missed since is delivered first.
        const missed = internals.since(type, record.subscription, request.cursor ?? null, request.maxAgeMs);
        const current = state(record);
        current.floor = missed.events.length ? request.cursor : missed.cursor;
        for (const event of missed.events) enqueue(record, event);
        return { id, refreshBefore: refreshBefore(record), cursor: watermark(record, type), truncated: missed.truncated };
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

// The body of a request, read no further than `limit` bytes. Undefined when it is longer.
async function read(request, limit) {
  if (Number(request.headers.get("content-length")) > limit) return undefined;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
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

/**
 * The client's end of webhook delivery: a function from a callback's Request to its Response, for any server that
 * speaks fetch. It checks each delivery's signature and age, answers the challenge, drops what it has seen, and hands
 * the rest to the subscription it belongs to.
 */
export function createReceiver({ tolerance = 5 * 60 } = {}) {
  // Subscriptions by the id the server derived, and those whose subscribe response has not said theirs yet.
  const routes = new Map();
  const waiting = new Set();
  // Subscriptions ended here, so a server still delivering to one is told to stop retrying.
  const ended = new Set();
  const bounded = (set, value) => { set.add(value); if (set.size > 1024) set.delete(set.values().next().value); };
  const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: body === undefined ? {} : { "content-type": "application/json" } });
  const unroute = listener => {
    const route = routes.get(listener.id);
    route?.delete(listener);
    if (route && !route.size) routes.delete(listener.id);
    return route && !route.size;
  };

  async function receive(request) {
    if (request.method !== "POST") return reply(405);
    const header = name => request.headers.get(name);
    const [id, timestamp, signature, subscription] = ["webhook-id", "webhook-timestamp", "webhook-signature", "x-mcp-subscription-id"].map(header);
    if (!id || !timestamp || !signature || !subscription) return reply(400);
    if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > tolerance) return reply(400);
    const body = await read(request, MAX_BODY);
    if (body === undefined) return reply(413);
    const signatures = signature.split(" ").filter(part => part.startsWith("v1,")).map(part => { try { return unbase64(part.slice(3)); } catch { return undefined; } }).filter(Boolean);
    // The listeners among these whose secret signed the delivery. Only they may hear it.
    const signers = async listeners => {
      const found = [];
      for (const listener of listeners) for (const bytes of signatures) if (await hmac(listener.secret, id, timestamp, body, bytes)) { found.push(listener); break; }
      return found;
    };
    const route = routes.get(subscription);
    const signed = await signers(route ?? []);
    // A subscription whose subscribe response has not arrived can answer a challenge, but is not routed to by what a
    // delivery says: the server tries its events again once the response has bound it.
    const pending = signed.length ? [] : await signers(waiting);
    if (!signed.length && !pending.length) return reply(!route && ended.has(subscription) ? 410 : 401);
    let message;
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

  /** Not for applications: the runtime's subscribe listens for one subscription's deliveries. */
  receive.listen = handle => {
    const listener = { secret: `whsec_${base64(random(32))}`, handle, seen: new Set() };
    waiting.add(listener);
    return {
      secret: listener.secret,
      // Routes the subscription's deliveries here, by the id its subscribe response gave.
      bind(id) {
        if (listener.id === id) return;
        if (listener.id) unroute(listener);
        waiting.delete(listener);
        listener.id = id;
        (routes.get(id) ?? routes.set(id, new Set()).get(id)).add(listener);
      },
      // Whether this was the last listener of its subscription, which the server can then be told to stop.
      close() {
        waiting.delete(listener);
        if (!listener.id || !unroute(listener)) return false;
        bounded(ended, listener.id);
        return true;
      },
    };
  };
  return receive;
}

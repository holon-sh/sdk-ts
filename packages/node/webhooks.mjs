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
// How many hosts one principal may have challenged for the first time in a window.
const PROBES = { window: 10 * 60_000, max: 5 };
// Re-checks of access that fail this many times in a row end a subscription.
const UNANSWERED = 3;
// The protocol's own refusals, which end a subscription. Anything else may pass, and is tried again.
const REFUSALS = [INVALID_PARAMS, NOT_FOUND, FORBIDDEN, RESOURCE_EXHAUSTED, -32026, CALLBACK_ENDPOINT_ERROR];
const INTERNAL_ERROR = -32603;
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
  concurrency = 4,
  allowInsecureLocalCallbacksForTesting = false,
} = {}) {
  // A subscription that never expires is never refreshed, so it must outlive the process: that needs a store.
  if (ttl === null && !store) throw new Error("Webhook subscriptions without expiry need a store that keeps them across restarts.");
  const local = allowInsecureLocalCallbacksForTesting === true;
  // Subscriptions being delivered to, by event name, then id; and what delivering to each has come to, which is kept
  // in memory only, lost on restart and begun again.
  const live = new Map();
  const states = new WeakMap();
  // Kept subscriptions whose event type is not declared yet.
  const parked = new Map();
  // Callback URLs each principal has proved it receives at, so their next subscriptions are not challenged again; URLs
  // whose challenge failed; and when each host was challenged lately.
  const verified = new Map();
  const failed = new Map();
  const challenged = new Map();
  // The hosts each principal had challenged lately, so one caller cannot have the server reach many new hosts.
  const probed = new Map();
  // Deliveries running to each endpoint, and those waiting for one of them to finish.
  const endpoints = new Map();
  const attached = new WeakSet();
  let internals;
  let loaded;

  const quietly = promise => void Promise.resolve(promise).catch(() => {});
  const principalOf = context => {
    const { principal } = getContext(context);
    return principal && { issuer: principal.issuer, subject: principal.subject };
  };
  const owner = (principal, url) => canonical([principal.issuer, principal.subject, url]);
  const endpointError = reason => new ProtocolError(CALLBACK_ENDPOINT_ERROR, "CallbackEndpointError", { reason });
  const expired = record => record.expiresAt !== null && record.expiresAt <= Date.now();
  const refreshBefore = record => record.expiresAt === null ? null : new Date(record.expiresAt).toISOString();

  // Stops delivering to a subscription and lets go of its place among its type's subscriptions. A newer subscription
  // with the same id is not this one's to remove.
  const forget = async record => {
    const state = states.get(record);
    states.delete(record);
    clearTimeout(state?.timer);
    state?.opened?.close();
    if (live.get(record.name)?.get(record.id) !== record) return;
    live.get(record.name).delete(record.id);
    await store?.remove(record.id);
  };

  // The safe-to-persist cursor: every event at or before it has been acknowledged or given up on.
  const watermark = state => state.queue.length ? state.floor : state.type.check ? state.reached : internals.position(state.type);

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

  // Tells a callback its subscription has ended, and why. It no longer exists, so this is sent once.
  const terminated = (record, error) => send(record, control("terminated"), JSON.stringify({
    type: "terminated", error: { code: error.code, message: error.message, ...(error.data !== undefined && { data: error.data }) },
  })).catch(() => {});
  // Ends a subscription the server no longer serves.
  const terminate = async (record, error) => {
    if (!states.has(record)) return;
    await forget(record).catch(() => {});
    await terminated(record, error);
  };

  // Events skipped, while too many were in flight or because the source moved past them, are a gap the client hears
  // of once the rest are through.
  const flush = (record, state) => {
    if (state.queue.length || !state.gap) return;
    state.gap = false;
    const body = JSON.stringify({ type: "gap", cursor: watermark(state) });
    quietly(attempt(record, { state, id: control("gap"), tries: 0, body: () => body }));
  };

  const settle = (record, entry) => {
    entry.settled = true;
    const { state } = entry;
    while (state.queue[0]?.settled) state.floor = state.queue.shift().cursor;
    flush(record, state);
  };

  const outcome = (record, state, result) => {
    const now = Date.now();
    state.outcomes.push({ at: now, ok: result.ok });
    while (state.outcomes[0].at < now - SUSPEND.window || state.outcomes.length > SUSPEND.attempts * 10) state.outcomes.shift();
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
  const attempt = async (record, entry) => {
    const { state } = entry;
    // A message of a subscription since ended, or made again, is not sent.
    if (states.get(record) !== state) return;
    if (expired(record)) return entry.event && settle(record, entry);
    // Messages wait while delivery is suspended, and while the caller's access is not known.
    if (!state.active || state.unknown) return void state.held.push(entry);
    let body;
    try { body = entry.body(); } catch { body = undefined; }
    // A body that cannot be made, or one too large for receivers, is given up on, as a receiver's 413 would be.
    if (body === undefined || encoder.encode(body).length > MAX_BODY) return entry.event && settle(record, entry);
    const result = await send(record, entry.id, body);
    if (states.get(record) !== state) return;
    // A receiver declining an event (410) or refusing its size (413) says nothing about the subscription, and is not retried.
    const declined = result.status === 410 || result.status === 413;
    if (!declined) outcome(record, state, result);
    if (result.ok || declined || ++entry.tries >= attempts) return entry.event && settle(record, entry);
    if (!state.active || state.unknown) return void state.held.push(entry);
    setTimeout(() => quietly(attempt(record, entry)), backoff * 5 ** (entry.tries - 1)).unref?.();
  };

  const enqueue = (record, event) => {
    const state = states.get(record);
    // Beyond what may be in flight, events are skipped, and the client is told of the gap.
    if (state.queue.length >= maxPending) return void (state.gap = true);
    if (state.queue.some(entry => entry.id === event.eventId)) return;
    // What a type with a check function emits carries no cursor of its own, and is placed where the subscription is.
    const entry = { state, id: event.eventId, event, cursor: event.cursor ?? state.reached, tries: 0 };
    entry.body = () => JSON.stringify({ ...event, cursor: state.queue[0] === entry ? entry.cursor : state.floor });
    state.queue.push(entry);
    quietly(attempt(record, entry));
  };

  // A type with a check function is asked every interval for what each subscription is owed since its cursor.
  const follow = (record, state, wait = state.type.interval) => {
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
  const begin = async (type, record, cursor, maxAgeMs, ready) => {
    const state = { type, queue: [], held: [], active: true, outcomes: [], gap: false, unknown: 0 };
    let ending;
    const end = error => {
      if (states.get(record) === state) quietly(terminate(record, error));
      else ending ??= error;
    };
    state.opened = await internals.open(type, { id: record.id, delivery: "webhook", arguments: record.subscription.arguments, context: record.subscription.context }, end);
    let missed;
    try {
      await ready?.();
      // Events emitted while it is read are in what it returns, and none are emitted between it and the sink seeing
      // this subscription, as reading emitted events does not wait.
      missed = internals.read(type, record.subscription, cursor ?? null, { maxAgeMs });
      if (missed instanceof Promise) missed = await missed;
      if (ending) throw new ProtocolError(ending.code, ending.message, ending.data);
    } catch (error) {
      state.opened.close();
      throw error;
    }
    Object.assign(state, { floor: missed.start, reached: missed.cursor });
    states.set(record, state);
    const prior = live.get(record.name)?.get(record.id);
    (live.get(record.name) ?? live.set(record.name, new Map()).get(record.name)).set(record.id, record);
    if (prior && prior !== record) quietly(forget(prior));
    for (const event of missed.events) enqueue(record, event);
    if (type.check) follow(record, state);
    return missed;
  };

  // A kept subscription resumes from where its type is now, once its type is declared. One the server refuses is
  // ended; one that fails otherwise, as a check or onSubscribe may once, is tried again, a little later each time.
  const resume = async (type, record, wait = 1000) => {
    if (expired(record) || internals.types.get(type.name) !== type) return store?.remove(record.id);
    try { await begin(type, record, null); } catch (error) {
      if (!REFUSALS.includes(error?.code)) return void setTimeout(() => quietly(resume(type, record, Math.min(wait * 2, 5 * 60_000))), wait).unref?.();
      await store?.remove(record.id);
      await terminated(record, error);
    }
  };

  // Each emitted event goes to the subscriptions of its type it is for.
  const attach = type => {
    if (attached.has(type)) return;
    attached.add(type);
    type.sinks.add(kept => {
      for (const record of [...(live.get(type.name)?.values() ?? [])]) {
        if (states.get(record)?.type !== type) continue;
        if (expired(record)) { quietly(forget(record)); continue; }
        const event = internals.shape(type, kept, record.subscription);
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
    for (const [host, times] of challenged) if (times.at(-1) <= now - VERIFICATIONS.window) challenged.delete(host);
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
          let holds;
          try {
            holds = await state.type.authorize(record.subscription.arguments, record.subscription.context);
          } catch (error) {
            if (states.get(record) !== state) continue;
            if (++state.unknown >= UNANSWERED) await terminate(record, { code: Number.isInteger(error?.code) ? error.code : INTERNAL_ERROR, message: error?.message || "InternalError", ...(error?.data !== undefined && { data: error.data }) });
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

  // Delivery begins as soon as the first event type is declared: kept subscriptions are read, and resume without
  // waiting for a server to be served or a client to subscribe again.
  // Reads the store once. One that fails to load fails the subscribe or unsubscribe waiting for it, and is read again
  // at the next, or at the next sweep.
  const load = () => loaded ??= Promise.resolve().then(() => store?.load()).then(records => {
    for (const record of records ?? []) {
      // A kept subscription exists only because its endpoint was verified, so it is not challenged again.
      verified.set(owner(record.principal, record.url), Infinity);
      const type = internals.types.get(record.name);
      if (type && attached.has(type)) quietly(resume(type, record));
      else (parked.get(record.name) ?? parked.set(record.name, []).get(record.name)).push(record);
    }
  }, error => {
    loaded = undefined;
    throw error;
  });
  let started = false;
  const start = given => {
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
  const verify = async (principal, url, id, secret) => {
    const key = owner(principal, url);
    const now = Date.now();
    if ((verified.get(key) ?? 0) > now) return;
    const failure = failed.get(url);
    if (failure && failure.until > now) throw endpointError(failure.reason);
    const { host } = new URL(url);
    const recent = (challenged.get(host) ?? []).filter(at => at > now - VERIFICATIONS.window);
    if (recent.length >= VERIFICATIONS.max) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "verifications", max: VERIFICATIONS.max });
    const who = canonical([principal.issuer, principal.subject]);
    const hosts = probed.get(who) ?? new Map();
    for (const [each, at] of hosts) if (at <= now - PROBES.window) hosts.delete(each);
    if (!hosts.has(host) && hosts.size >= PROBES.max) throw new ProtocolError(RESOURCE_EXHAUSTED, "ResourceExhausted", { limit: "verificationHosts", max: PROBES.max });
    probed.set(who, hosts.set(host, now));
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

  // The subscription a request names, checked as the events of every mode are, with the type's authorization. Its
  // id is made from the key the type gives the caller, event and arguments, and the callback URL. A caller with a
  // principal always has that key.
  const keyed = async (request, context) => {
    const principal = principalOf(context);
    if (!principal) throw new ProtocolError(FORBIDDEN, "Forbidden", { reason: "Webhook delivery needs an authenticated principal." });
    const url = request.delivery?.url;
    let parsed;
    try { parsed = new URL(url); } catch {}
    if (!parsed || parsed.protocol !== "https:" && !(local && parsed.protocol === "http:") || parsed.username || parsed.password)
      throw new ProtocolError(INVALID_PARAMS, "delivery.url must be an https URL.");
    const { type, subscription } = await internals.subscription(request, context, "webhook");
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify([subscription.lease ?? subscription.id, url])));
    const id = `sub_${hex(digest).slice(0, 32)}`;
    return { type, principal, url, id, subscription: { id, arguments: subscription.arguments, context: keep(subscription.context) } };
  };

  // The granted lifetime: the client's suggestion within the server's floor and cap. No expiry only when both allow it.
  const grant = suggested => {
    if (suggested === null && ttl === null) return null;
    const cap = ttl ?? Infinity;
    const wanted = typeof suggested === "number" && suggested > 0 ? suggested : cap === Infinity ? 24 * 60 * 60_000 : cap;
    return Math.max(minTtl, Math.min(wanted, cap));
  };

  // Only what match, transform and authorize may read of the subscribing request is kept: never its token.
  const keep = context => {
    const authInfo = context?.authInfo;
    return authInfo && { authInfo: { clientId: authInfo.clientId, scopes: authInfo.scopes, ...(authInfo.extra && { extra: authInfo.extra }) } };
  };

  return {
    name: "webhook",
    declared(type, given) {
      start(given);
      attach(type);
    },
    serve(server, given) {
      start(given);
      for (const type of internals.types.values()) attach(type);
      server.setRequestHandler("events/subscribe", { params: anything }, async (request, ctx) => {
        await load();
        if (request.delivery?.mode !== undefined && request.delivery.mode !== "webhook") throw new ProtocolError(INVALID_PARAMS, "delivery.mode must be webhook.");
        if (!secretBytes(request.delivery?.secret)) throw new ProtocolError(INVALID_PARAMS, "delivery.secret must be whsec_ and the base64 of 24 to 64 bytes.");
        const { type, subscription, principal, url, id } = await keyed(request, ctx.http);
        attach(type);
        const granted = grant(request.ttlMs);
        const expiresAt = granted === null ? null : Date.now() + granted;
        const existing = live.get(type.name)?.get(id);
        const state = existing && states.get(existing);
        if (state?.type === type && !expired(existing)) {
          // A refresh: the TTL is granted again, a new secret replaces the old, and suspended delivery resumes.
          const deliveryStatus = { active: state.active, lastDeliveryAt: state.lastDeliveryAt ?? null, lastError: state.lastError ?? null, ...(state.failedSince && { failedSince: state.failedSince }) };
          Object.assign(existing, {
            expiresAt,
            subscription,
            ...(existing.secret !== request.delivery.secret && { secret: request.delivery.secret, previous: { secret: existing.secret, until: Date.now() + ROTATION_GRACE } }),
          });
          await store?.save(existing);
          // Failures before the refresh do not count toward suspending it again.
          Object.assign(state, { active: true, outcomes: [] });
          for (const entry of state.held.splice(0)) quietly(attempt(existing, entry));
          return { id, refreshBefore: refreshBefore(existing), cursor: watermark(state), truncated: false, deliveryStatus };
        }
        const record = { id, principal, url, name: type.name, secret: request.delivery.secret, expiresAt, subscription };
        // A new subscription is counted against the limits before its endpoint is challenged, and starts from the
        // client's cursor: what it missed since is delivered first.
        const missed = await begin(type, record, request.cursor, request.maxAgeMs, () => verify(principal, url, id, request.delivery.secret));
        await store?.save(record);
        const started = states.get(record);
        return { id, refreshBefore: refreshBefore(record), cursor: started ? watermark(started) : missed.cursor, truncated: missed.truncated };
      });
      server.setRequestHandler("events/unsubscribe", { params: anything }, async (request, ctx) => {
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { createEvents } from "holon-sh/events";
import { createReceiver, webhooks } from "holon-sh/webhooks";
import { serve } from "./helpers.mjs";

const identity = { name: "test", version: "1.0.0" };
// The caller Holon admitted, as it reaches the server.
const ann = { clientId: "web", scopes: [], extra: { iss: "https://id.example", sub: "ann" } };
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

// A server whose rooms say things, by webhook too. A room can be closed to its subscribers.
async function rooms(t, options) {
  const closed = new Set();
  const events = createEvents({ modes: [webhooks({ allowInsecureLocalCallbacksForTesting: true, backoff: 10, reverify: 0, ...options })] });
  const said = events.event("room.said", {
    inputSchema: z.object({ room: z.string() }).refine(({ room }) => !closed.has(room), "The room is closed."),
    payloadSchema: z.object({ text: z.string() }),
    match: ({ room }, args) => room === args.room,
    transform: ({ text }) => ({ text }),
  });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "rooms", version: "1.0.0" });
    events.serve(server);
    return server;
  }, request => { request.auth = ann; });
  return { endpoint, say: (room, text) => said.emit({ room, text }, { eventId: text }), close: room => closed.add(room) };
}

// An HTTP server that answers with a function from a Request to a Response, as a receiver is mounted.
async function host(t, handle) {
  const http = createServer(async (incoming, outgoing) => {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const response = await handle(new Request(`http://${incoming.headers.host}${incoming.url}`, { method: incoming.method, headers: incoming.headers, body: incoming.method === "POST" ? Buffer.concat(chunks) : undefined }));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  });
  t.after(() => { http.closeAllConnections(); http.close(); });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  return `http://127.0.0.1:${http.address().port}`;
}

async function subscribed(t, options) {
  const server = await rooms(t, options);
  const receiver = createReceiver();
  const posts = [];
  const url = `${await host(t, request => { posts.push(request.headers.get("webhook-id")); return receiver(request); })}/hooks`;
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint: server.endpoint } }, { webhook: { url, receiver } });
  t.after(() => app.close());
  const subscription = await app.events.subscribe("room.said", { room: "a" });
  return { ...server, subscription, posts };
}

// A plain MCP client, to send the sketch's messages as they are.
async function client(t, endpoint) {
  const mcp = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => mcp.close());
  return (method, params) => mcp.request({ method, params }, z.looseObject({}));
}

async function take(subscription, count) {
  const texts = [];
  for await (const { data } of subscription) if (texts.push(data.text) === count) break;
  return texts;
}

test("a client with a receiver is delivered its events by webhook, keeps its subscription by refreshing it, and lets go of it when it ends", { timeout: 10_000 }, async t => {
  // Grants of a few hundred milliseconds lapse during the test unless the client refreshes them.
  const { subscription, say, posts } = await subscribed(t, { ttl: 300, minTtl: 100 });
  assert.equal(subscription.delivery, "webhook");
  say("a", "one");
  say("b", "another room");
  await wait(800);
  // A lapsed subscription would be made again from its cursor at the next refresh, so this one must be live now.
  say("a", "two");
  await wait(100);
  assert.ok(posts.includes("two"));
  assert.deepEqual(await take(subscription, 2), ["one", "two"]);
  assert.equal(typeof subscription.cursor, "string");

  // Leaving the loop unsubscribed, so the server sends nothing more.
  await wait(100);
  const sent = posts.length;
  say("a", "three");
  await wait(100);
  assert.equal(posts.length, sent);
});

test("a subscription the server no longer serves ends with the error it was terminated with", async t => {
  const { subscription, say, close } = await subscribed(t);
  close("a");
  say("a", "one");
  await assert.rejects(take(subscription, 1), error => error.code === -32602 && /ended the subscription to room.said: .*The room is closed/.test(error.message));
});

test("a server that restarts with a store delivers to the subscriptions it kept, though no client subscribes again", { timeout: 10_000 }, async t => {
  const kept = new Map();
  const store = {
    load: () => [...kept.values()].map(record => structuredClone(record)),
    save: record => { kept.set(record.id, structuredClone(record)); },
    remove: id => { kept.delete(id); },
  };
  const { subscription } = await subscribed(t, { store });
  // Another process with the same store. The client still talks to the first, so this one is never subscribed to.
  const restarted = await rooms(t, { store });
  await (await client(t, restarted.endpoint))("events/list", {});
  restarted.say("a", "after the restart");
  assert.deepEqual(await take(subscription, 1), ["after the restart"]);
});

test("the server speaks the sketch's webhook messages, and delivers only to an https endpoint that proved it wants them", async t => {
  const connect = endpoint => client(t, endpoint);
  const secret = `whsec_${randomBytes(32).toString("base64")}`;
  const params = (url, more) => ({ name: "room.said", arguments: { room: "a" }, delivery: { mode: "webhook", url, secret }, ...more });
  const refused = (code, reason) => error => error.code === code && (reason === undefined || error.data?.reason === reason);

  // Without the testing allowance, only https callbacks at public addresses, from an authenticated caller.
  const strict = await rooms(t, { allowInsecureLocalCallbacksForTesting: false });
  const request = await connect(strict.endpoint);
  await assert.rejects(request("events/subscribe", params("http://hooks.example/a")), refused(-32602));
  await assert.rejects(request("events/subscribe", { ...params("https://hooks.example/a"), delivery: { url: "https://hooks.example/a", secret: "whsec_c2hvcnQ=" } }), refused(-32602));
  await assert.rejects(request("events/subscribe", params("https://127.0.0.1:1/a")), refused(-32027, "connection_refused"));
  const events = createEvents({ modes: [webhooks()] });
  events.event("room.said", { inputSchema: z.object({}), payloadSchema: z.object({}) });
  const anonymous = await serve(t, () => { const server = new McpServer({ name: "rooms", version: "1.0.0" }); events.serve(server); return server; });
  await assert.rejects((await connect(anonymous.endpoint))("events/subscribe", params("https://hooks.example/a")), refused(-32024));

  // An endpoint that checks each delivery's Standard Webhooks signature, fails each event's first attempt, and echoes
  // challenges only at /yes.
  const received = [];
  const failed = new Set();
  const root = await host(t, async incoming => {
    const body = await incoming.text();
    const [id, timestamp, signature] = ["webhook-id", "webhook-timestamp", "webhook-signature"].map(name => incoming.headers.get(name));
    const expected = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${timestamp}.${body}`).digest("base64");
    assert.equal(signature, `v1,${expected}`);
    const message = JSON.parse(body);
    if (message.type === "verification") return Response.json(new URL(incoming.url).pathname === "/yes" ? { challenge: message.challenge } : {});
    received.push({ id, subscription: incoming.headers.get("x-mcp-subscription-id"), message });
    if (failed.has(id)) return new Response(null, { status: 204 });
    failed.add(id);
    return new Response(null, { status: 503 });
  });
  const { endpoint, say } = await rooms(t);
  const call = await connect(endpoint);
  await assert.rejects(call("events/subscribe", params(`${root}/no`)), refused(-32027, "challenge_failed"));
  const { _meta, ...subscribed } = await call("events/subscribe", params(`${root}/yes`, { ttlMs: 120_000 }));
  assert.deepEqual(Object.keys(subscribed), ["id", "refreshBefore", "cursor", "truncated"]);
  assert.match(subscribed.id, /^sub_/);
  assert.ok(Date.parse(subscribed.refreshBefore) <= Date.now() + 120_000);
  say("a", "one");
  while (received.length < 2) await wait(5);
  const [first, retried] = received;
  assert.deepEqual({ ...first, message: Object.keys(first.message) }, { id: "one", subscription: subscribed.id, message: ["eventId", "name", "timestamp", "data", "cursor"] });
  assert.deepEqual(retried.message, first.message);

  const refreshed = await call("events/subscribe", params(`${root}/yes`, { ttlMs: null, cursor: subscribed.cursor }));
  assert.equal(refreshed.id, subscribed.id);
  // No expiry is granted only by a server that keeps subscriptions across restarts.
  assert.notEqual(refreshed.refreshBefore, null);
  assert.deepEqual({ ...refreshed.deliveryStatus, lastDeliveryAt: typeof refreshed.deliveryStatus.lastDeliveryAt }, { active: true, lastDeliveryAt: "string", lastError: null });
  const unsubscribe = params(`${root}/yes`);
  delete unsubscribe.delivery.secret;
  const { _meta: __, ...acknowledged } = await call("events/unsubscribe", unsubscribe);
  assert.deepEqual(acknowledged, {});
  await assert.rejects(call("events/unsubscribe", unsubscribe), refused(-32023));
});

test("the receiver accepts only fresh deliveries signed with its subscription's secret, and each once", async t => {
  const receiver = createReceiver();
  const heard = [];
  const listening = receiver.listen(message => heard.push(message));
  const post = (subscription, id, body, { secret = listening.secret, age = 0 } = {}) => {
    const timestamp = String(Math.floor(Date.now() / 1000) - age);
    const text = JSON.stringify(body);
    const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${timestamp}.${text}`).digest("base64");
    return receiver(new Request("https://app.example/hooks", { method: "POST", body: text, headers: { "webhook-id": id, "webhook-timestamp": timestamp, "webhook-signature": `v1,${signature}`, "x-mcp-subscription-id": subscription } }));
  };
  const event = { eventId: "e1", name: "room.said", timestamp: new Date().toISOString(), data: { text: "one" }, cursor: "c1" };

  // The challenge comes before the subscribe response says the subscription's id, and the secret tells whose it is.
  // Deliveries wait for that response.
  const challenged = await post("sub_1", "msg_verification_1", { type: "verification", challenge: "nonce" });
  assert.deepEqual([challenged.status, await challenged.json()], [200, { challenge: "nonce" }]);
  assert.equal((await post("sub_1", "e1", event)).status, 503);
  listening.bind("sub_1");
  assert.equal((await post("sub_1", "e1", event)).status, 204);
  assert.equal((await post("sub_1", "e1", event)).status, 204);
  assert.equal((await post("sub_1", "e2", event, { secret: `whsec_${randomBytes(32).toString("base64")}` })).status, 401);
  assert.equal((await post("sub_1", "e3", event, { age: 600 })).status, 400);
  assert.deepEqual(heard, [event]);
  assert.equal(listening.close(), true);
  assert.equal((await post("sub_1", "e4", event)).status, 410);
});

test("a delivery reaches only the subscription whose secret signed it, whichever subscription it names", async () => {
  const receiver = createReceiver();
  const [a, b] = [[], []].map(heard => Object.assign(receiver.listen(message => heard.push(message)), { heard }));
  const post = (subscription, secret, eventId) => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const text = JSON.stringify({ eventId, name: "room.said", timestamp: new Date().toISOString(), data: {} });
    const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${eventId}.${timestamp}.${text}`).digest("base64");
    return receiver(new Request("https://app.example/hooks", { method: "POST", body: text, headers: { "webhook-id": eventId, "webhook-timestamp": timestamp, "webhook-signature": `v1,${signature}`, "x-mcp-subscription-id": subscription } }));
  };
  b.bind("sub_b");
  // A server given a's secret names b's subscription, before a's subscribe response has arrived and after.
  await post("sub_b", a.secret, "forged before");
  a.bind("sub_a");
  await post("sub_b", a.secret, "forged after");
  await post("sub_a", a.secret, "a's own");
  assert.deepEqual([a.heard.map(({ eventId }) => eventId), b.heard], [["a's own"], []]);
});

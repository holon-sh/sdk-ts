import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import type { TestContext } from "node:test";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, type Subscription } from "holon-sh/runtime";
import { createEvents } from "holon-sh/ext/events";
import { createReceiver, webhooks, type WebhookOptions, type WebhookSubscription } from "holon-sh/ext/webhooks";
import { serve } from "./helpers.ts";

const identity = { name: "test", version: "1.0.0" };
// The caller Holon admitted, as it reaches the server.
const ann = { clientId: "web", scopes: [], extra: { iss: "https://id.example", sub: "ann" } };
// The Node adapter hands the server what upstream middleware attached as auth.
const admit = (request: IncomingMessage) => { (request as IncomingMessage & { auth?: typeof ann }).auth = ann; };
const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
/** What a server answers or refuses, as a plain client reads it. */
type Answer = Record<string, any>;
interface Refusal { code?: number; message: string; data?: { reason?: string } }

// A server whose rooms say things, by webhook too. A room can be closed to its subscribers, and whether one is open
// can become impossible to tell.
async function rooms(t: TestContext, options?: WebhookOptions) {
  const closed = new Set<string>();
  const unknown = new Set<string>();
  const events = createEvents({ modes: [webhooks({ allowInsecureLocalCallbacksForTesting: true, backoff: 10, reverify: 20, ...options })] });
  const said = events.event("room.said", {
    inputSchema: z.object({ room: z.string() }),
    authorize: ({ room }) => {
      if (unknown.has(room)) throw new Error("The directory is down.");
      return !closed.has(room);
    },
    payloadSchema: z.object({ text: z.string() }),
    match: ({ room }: { room: string; text: string }, args) => room === args.room,
    transform: ({ text }) => ({ text }),
  });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "rooms", version: "1.0.0" });
    events.serve(server);
    return server;
  }, admit);
  return { endpoint, say: (room: string, text: string) => said.emit({ room, text }, { eventId: text }), close: (room: string) => closed.add(room), lose: (room: string) => unknown.add(room) };
}

// An HTTP server that answers with a function from a Request to a Response, as a receiver is mounted.
async function host(t: TestContext, handle: (request: Request) => Response | Promise<Response>) {
  const http = createServer(async (incoming, outgoing) => {
    const chunks: Buffer[] = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const headers = Object.entries(incoming.headers).flatMap(([name, value]) => value === undefined ? [] : [[name, String(value)] as [string, string]]);
    const response = await handle(new Request(`http://${incoming.headers.host}${incoming.url}`, { method: incoming.method ?? "GET", headers, body: incoming.method === "POST" ? Buffer.concat(chunks) : null }));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  });
  t.after(() => { http.closeAllConnections(); http.close(); });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  return `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
}

async function subscribed(t: TestContext, options?: WebhookOptions, room = "a") {
  const server = await rooms(t, options);
  const receiver = createReceiver();
  const posts: Array<string | null> = [];
  const url = `${await host(t, request => { posts.push(request.headers.get("webhook-id")); return receiver(request); })}/hooks`;
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint: server.endpoint } }, { ext: { events: { webhook: { url, receiver } } } });
  t.after(() => app?.close());
  const subscribe = (room: string) => app!.ext.events.subscribe("room.said", { room });
  return { ...server, subscription: await subscribe(room), subscribe, posts };
}

// A plain MCP client, to send the sketch's messages as they are.
async function client(t: TestContext, endpoint: string) {
  const mcp = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => mcp.close());
  return (method: string, params: Record<string, unknown>): Promise<Answer> => mcp.request({ method, params }, z.looseObject({}));
}

async function take(subscription: Subscription, count: number) {
  const texts: string[] = [];
  for await (const { data } of subscription) if (texts.push((data as { text: string }).text) === count) break;
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

test("a subscription whose caller loses access is ended while nothing is emitted, though a check of another one keeps failing", { timeout: 10_000 }, async t => {
  // The failing check comes first, and must not keep the other subscription from being checked.
  const { subscription: failing, subscribe, close, lose } = await subscribed(t, {}, "b");
  const subscription = await subscribe("a");
  lose("b");
  close("a");
  await assert.rejects(take(subscription, 1), (error: Refusal) => error.code === -32024 && /ended the subscription to room.said: Forbidden/.test(error.message));
  // Access that cannot be told for a few checks in a row ends the subscription with why.
  await assert.rejects(take(failing, 1), (error: Refusal) => /ended the subscription to room.said: The directory is down/.test(error.message));
});

test("a subscription its type ends while it is being set up is refused, delivers nothing, and is torn down", { timeout: 10_000 }, async t => {
  const reading = Promise.withResolvers<void>();
  const checking = Promise.withResolvers<void>();
  const teardowns: string[] = [];
  const delivered: string[] = [];
  const events = createEvents({ modes: [webhooks({ allowInsecureLocalCallbacksForTesting: true, backoff: 10 })] });
  const tick = events.event("tick", {
    inputSchema: z.object({}),
    payloadSchema: z.object({}),
    interval: 10,
    // The first check, which setting up the subscription waits for, takes until the test lets it go.
    check: async cursor => {
      if (cursor === null) { checking.resolve(); await reading.promise; return { events: [], cursor: "0" }; }
      return { events: [{ eventId: `after ${cursor}`, data: {} }], cursor: String(Number(cursor) + 1) };
    },
    onSubscribe: () => () => teardowns.push("torn down"),
  });
  const { endpoint } = await serve(t, () => { const server = new McpServer({ name: "ticks", version: "1.0.0" }); events.serve(server); return server; }, admit);
  const root = await host(t, async incoming => {
    const message = JSON.parse(await incoming.text());
    if (message.type === "verification") return Response.json({ challenge: message.challenge });
    delivered.push(message.eventId ?? message.type);
    return new Response(null, { status: 204 });
  });
  const call = await client(t, endpoint);
  const subscribing = call("events/subscribe", { name: "tick", arguments: {}, delivery: { url: `${root}/hooks`, secret: `whsec_${randomBytes(32).toString("base64")}` } });
  await checking.promise;
  tick.remove();
  reading.resolve();
  await assert.rejects(subscribing, (error: Refusal) => error.code === -32023);
  await wait(100);
  assert.deepEqual([teardowns, delivered], [["torn down"], []]);
});

test("a server that restarts with a store delivers to the subscriptions it kept, though no client subscribes again", { timeout: 10_000 }, async t => {
  const kept = new Map<string, WebhookSubscription>();
  const store = {
    load: () => [...kept.values()].map(record => structuredClone(record)),
    save: (record: WebhookSubscription) => { kept.set(record.id, structuredClone(record)); },
    remove: (id: string) => { kept.delete(id); },
  };
  const { subscription } = await subscribed(t, { store });
  // Another process with the same store. The client still talks to the first, so this one is never subscribed to, and
  // nothing has asked it anything.
  const restarted = await rooms(t, { store });
  restarted.say("a", "after the restart");
  assert.deepEqual(await take(subscription, 1), ["after the restart"]);
});

test("the server speaks the sketch's webhook messages, and delivers only to an https endpoint that proved it wants them", async t => {
  const connect = (endpoint: string) => client(t, endpoint);
  const secret = `whsec_${randomBytes(32).toString("base64")}`;
  const params = (url: string, more?: Record<string, unknown>) => ({ name: "room.said", arguments: { room: "a" }, delivery: { mode: "webhook", url, secret } as { mode: string; url: string; secret?: string }, ...more });
  const refused = (code: number, reason?: string) => (error: Refusal) => error.code === code && (reason === undefined || error.data?.reason === reason);

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
  const received: Array<{ id: string | null; subscription: string | null; message: Answer }> = [];
  const failed = new Set<string | null>();
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
  const [first, retried] = received as [typeof received[number], typeof received[number]];
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
  const heard: unknown[] = [];
  const listening = receiver.listen(message => heard.push(message));
  const post = (subscription: string, id: string, body: unknown, { secret = listening.secret, age = 0 } = {}) => {
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
  const [a, b] = [[], []].map((heard: Array<{ eventId: string }>) => Object.assign(receiver.listen(message => heard.push(message as { eventId: string })), { heard })) as [ReturnType<typeof receiver.listen> & { heard: Array<{ eventId: string }> }, ReturnType<typeof receiver.listen> & { heard: Array<{ eventId: string }> }];
  const post = (subscription: string, secret: string, eventId: string) => {
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

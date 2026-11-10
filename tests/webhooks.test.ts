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
import { createEvents, type WebhookOptions } from "holon-sh/ext/events";
import { serve } from "./helpers.ts";

const identity = { name: "test", version: "1.0.0" };
// The caller Holon admitted, as it reaches the server.
const ann = { clientId: "web", scopes: [], extra: { iss: "https://id.example", sub: "ann" } };
// The Node adapter hands the server what upstream middleware attached as auth.
const admit = (request: IncomingMessage) => { (request as IncomingMessage & { auth?: typeof ann }).auth = ann; };
const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
const until = async (condition: () => unknown) => { while (!condition()) await wait(5); };
/** What a server answers or refuses, as a plain client reads it. */
type Answer = Record<string, any>;
interface Refusal { code?: number; message: string; data?: { reason?: string } }
// The secret a subscriber gives, as a client would make it.
const secret = `whsec_${randomBytes(32).toString("base64")}`;

// A server whose rooms say things, by webhook too. A room can be closed to its subscribers, and whether one is open
// can become impossible to tell.
async function rooms(t: TestContext, options?: WebhookOptions & { webhookTtl?: number }) {
  const closed = new Set<string>();
  const unknown = new Set<string>();
  const { webhookTtl = 30 * 60_000, ...webhook } = options ?? {};
  const events = createEvents({ webhookTtl, webhook: { allowInsecureLocalCallbacksForTesting: true, ...webhook } });
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

// An HTTP server that answers with a function from a Request to a Response.
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

// A callback endpoint, as a subscriber's would be: it checks each delivery's signature, answers challenges, and keeps
// what it is delivered, by the subscription each names.
async function callback(t: TestContext) {
  const received: Array<{ subscription: string | null; message: Answer }> = [];
  const root = await host(t, async incoming => {
    const body = await incoming.text();
    const [id, timestamp, signature] = ["webhook-id", "webhook-timestamp", "webhook-signature"].map(name => incoming.headers.get(name));
    assert.equal(signature, `v1,${createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${timestamp}.${body}`).digest("base64")}`);
    const message = JSON.parse(body) as Answer;
    if (message.type === "verification") return Response.json({ challenge: message.challenge });
    received.push({ subscription: incoming.headers.get("x-mcp-subscription-id"), message });
    return new Response(null, { status: 204 });
  });
  const said = (subscription: string) => received.filter(each => each.subscription === subscription && !each.message.type).map(each => each.message.data.text);
  const ended = (subscription: string) => received.find(each => each.subscription === subscription && each.message.type === "terminated")?.message.error;
  return { url: `${root}/hooks`, said, ended };
}

// A plain MCP client, to send the sketch's messages as they are.
async function client(t: TestContext, endpoint: string) {
  const mcp = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => mcp.close());
  return (method: string, params: Record<string, unknown>): Promise<Answer> => mcp.request({ method, params }, z.looseObject({}));
}

// Subscribes to a room's events by webhook, as a client would.
async function subscriber(t: TestContext, endpoint: string, url: string) {
  const call = await client(t, endpoint);
  return {
    subscribe: (room: string, more?: Record<string, unknown>) => call("events/subscribe", { name: "room.said", arguments: { room }, delivery: { mode: "webhook", url, secret }, ...more }),
    unsubscribe: (room: string) => call("events/unsubscribe", { name: "room.said", arguments: { room }, delivery: { url } }),
  };
}

test("a subscription is delivered its events while it is refreshed, lapses when it is not, and ends when unsubscribed", { timeout: 10_000 }, async t => {
  // Grants of a few hundred milliseconds lapse during the test unless they are refreshed.
  const server = await rooms(t, { webhookTtl: 600 });
  const { url, said } = await callback(t);
  const { subscribe, unsubscribe } = await subscriber(t, server.endpoint, url);
  const kept = await subscribe("a", { ttlMs: 600 });
  const lapsed = await subscribe("b", { ttlMs: 600 });
  server.say("a", "one");
  server.say("b", "two");
  await wait(400);
  await subscribe("a", { ttlMs: 600, cursor: kept.cursor });
  await wait(400);
  server.say("a", "three");
  server.say("b", "four");
  await wait(100);
  assert.deepEqual([said(kept.id), said(lapsed.id)], [["one", "three"], ["two"]]);

  // Still within its grant, but unsubscribed, so the server sends nothing more.
  await unsubscribe("a");
  server.say("a", "five");
  await wait(100);
  assert.deepEqual(said(kept.id), ["one", "three"]);
});

test("a subscription whose caller loses access is terminated while nothing is emitted, though a check of another one keeps failing", { timeout: 10_000 }, async t => {
  // Access is checked again every thirty seconds, which the test's clock jumps to.
  t.mock.timers.enable({ apis: ["setInterval"] });
  const server = await rooms(t);
  const { url, ended } = await callback(t);
  const { subscribe } = await subscriber(t, server.endpoint, url);
  // The failing check comes first, and must not keep the other subscription from being checked.
  const failing = await subscribe("b");
  const closing = await subscribe("a");
  server.lose("b");
  server.close("a");
  await until(() => { t.mock.timers.tick(30_000); return ended(closing.id) && ended(failing.id); });
  assert.deepEqual([ended(closing.id).code, ended(closing.id).message], [-32024, "Forbidden"]);
  // Access that cannot be told for a few checks in a row ends the subscription with why.
  assert.equal(ended(failing.id).message, "The directory is down.");
});

test("a subscription its type ends while it is being set up is refused, delivers nothing, and is torn down", { timeout: 10_000 }, async t => {
  const answering = Promise.withResolvers<void>();
  const challenged = Promise.withResolvers<void>();
  const teardowns: string[] = [];
  const delivered: string[] = [];
  const events = createEvents({ webhookTtl: 30 * 60_000, webhook: { allowInsecureLocalCallbacksForTesting: true } });
  const tick = events.event("tick", {
    inputSchema: z.object({}),
    payloadSchema: z.object({}),
    onUnsubscribe: () => { teardowns.push("torn down"); },
  });
  const { endpoint } = await serve(t, () => { const server = new McpServer({ name: "ticks", version: "1.0.0" }); events.serve(server); return server; }, admit);
  const root = await host(t, async incoming => {
    const message = JSON.parse(await incoming.text());
    // The challenge, which setting up the subscription waits for, is answered when the test lets it be.
    if (message.type === "verification") {
      challenged.resolve();
      await answering.promise;
      return Response.json({ challenge: message.challenge });
    }
    delivered.push(message.eventId ?? message.type);
    return new Response(null, { status: 204 });
  });
  const call = await client(t, endpoint);
  const subscribing = call("events/subscribe", { name: "tick", arguments: {}, delivery: { url: `${root}/hooks`, secret: `whsec_${randomBytes(32).toString("base64")}` } });
  await challenged.promise;
  tick.remove();
  answering.resolve();
  await assert.rejects(subscribing, (error: Refusal) => error.code === -32023);
  await wait(100);
  assert.deepEqual([teardowns, delivered], [["torn down"], []]);
});

// A failed delivery is tried again after five seconds.
test("the server speaks the sketch's webhook messages, and delivers only to an https endpoint that proved it wants them", { timeout: 20_000 }, async t => {
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
  const events = createEvents({ webhookTtl: 30 * 60_000 });
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
  // No expiry is never granted: it needs storage the server does not have.
  assert.notEqual(refreshed.refreshBefore, null);
  assert.deepEqual({ ...refreshed.deliveryStatus, lastDeliveryAt: typeof refreshed.deliveryStatus.lastDeliveryAt }, { active: true, lastDeliveryAt: "string", lastError: null });
  const unsubscribe = params(`${root}/yes`);
  delete unsubscribe.delivery.secret;
  const { _meta: __, ...acknowledged } = await call("events/unsubscribe", unsubscribe);
  assert.deepEqual(acknowledged, {});
  await assert.rejects(call("events/unsubscribe", unsubscribe), refused(-32023));
});

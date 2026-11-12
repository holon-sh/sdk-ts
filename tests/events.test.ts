import { test, type TestContext } from "node:test";
import type { IncomingMessage } from "node:http";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, type SubscribeOptions, type Subscription } from "holon-sh/runtime";
import { createEvents, type EventDefinition, type Events } from "holon-sh/ext/events";
import { serve, serveLegacy } from "./helpers.ts";

const identity = { name: "test", version: "1.0.0" };
// Wire messages are checked by the assertions that read them.
const loose = z.any();
type Listener = { room: string; listener: string };
type Said = { room: string; speaker: string; text: string };

// Serves a process's event types on each MCP server made for a request.
const served = (events: Events) => () => {
  const server = new McpServer({ name: "test", version: "1.0.0" });
  events.serve(server);
  return server;
};

// A server whose rooms say things: a subscription names a room and hears what the others in it say. What is said is
// its own event id.
function rooms(definition: Partial<EventDefinition<Listener, Said>> = {}) {
  const events = createEvents();
  const said = events.event<Listener, Said>("room.said", {
    description: "Someone said something in a room",
    inputSchema: z.object({ room: z.string(), listener: z.string() }),
    payloadSchema: z.object({ text: z.string() }),
    match: ({ room, speaker }, args) => room === args.room && speaker !== args.listener,
    transform: ({ text }) => ({ text }),
    ...definition,
  });
  const say = (room: string, speaker: string, text: string, to?: string) => said.emit({ room, speaker, text }, { eventId: text, subscriptionId: to });
  return { events, factory: served(events), said, say };
}

// The events of the app at an endpoint, as a Holon client reaches them. Its subscriptions end with the test, or they
// would keep reconnecting to a server that is gone, and the test would never exit.
function connect(t: TestContext, endpoint: string, { contract = null, fetch }: { contract?: Parameters<typeof createApps>[1][string]; fetch?: typeof globalThis.fetch } = {}) {
  const { app } = createApps(identity, { app: contract }, { app: { endpoint, ...(fetch && { fetch }) } });
  const ended = new AbortController();
  t.after(() => { ended.abort(); return app.close(); });
  const { list, subscribe } = app.ext.events;
  return {
    list,
    subscribe: (name: string, args: Record<string, unknown>, { signal, ...options }: SubscribeOptions = {}) =>
      subscribe(name, args, { ...options, signal: signal ? AbortSignal.any([signal, ended.signal]) : ended.signal }),
  };
}

// The ids of the next events a subscription receives, which goes on receiving.
const iterators = new WeakMap<Subscription, AsyncIterator<{ eventId: string }>>();
async function next(subscription: Subscription, count: number) {
  if (!iterators.has(subscription)) iterators.set(subscription, subscription[Symbol.asyncIterator]());
  const ids: string[] = [];
  while (ids.length < count) ids.push((await iterators.get(subscription)!.next()).value.eventId);
  return ids;
}

// The ids of the next events a subscription receives, after which it is cancelled.
async function take(subscription: Subscription, count: number) {
  const ids = await next(subscription, count);
  subscription.cancel();
  return ids;
}

// A client that speaks the wire messages, and keeps every events notification it hears.
async function wire(t: TestContext, endpoint: string) {
  const client = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const streams = new AbortController();
  t.after(() => { streams.abort(); return client.close(); });
  const heard: any[] = [];
  for (const kind of ["active", "event", "heartbeat", "error", "terminated"])
    client.setNotificationHandler(`notifications/events/${kind}`, { params: loose }, ({ _meta, ...params }) => { heard.push({ kind, id: _meta["io.modelcontextprotocol/subscriptionId"], ...params }); });
  const request = (method: string, params: Record<string, unknown>): Promise<any> => client.request({ method, params }, loose, method === "events/stream" ? { signal: streams.signal } : {});
  return { client, heard, request };
}

async function until(condition: () => unknown) {
  for (const deadline = Date.now() + 5000; !condition();) {
    if (Date.now() > deadline) throw new Error("Timed out waiting");
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

// Every request comes from one signed-in user, through one client.
const signedIn = (request: IncomingMessage & { auth?: unknown }) => {
  request.auth = { token: "token", clientId: "page", scopes: ["read"], extra: { iss: "https://issuer.example", sub: "ann" } };
};

const refusedWith = (code: number, data?: unknown) => (error: any) => {
  assert.equal(error.code, code);
  if (data) assert.deepEqual(error.data, data);
  return true;
};

test("a subscription hears what its arguments match, in order and with nothing missed, by push or poll, across dropped and ended streams", async t => {
  const { factory, say } = rooms();
  const { endpoint, http } = await serve(t, factory);
  const events = connect(t, endpoint);
  const pushed = await events.subscribe("room.said", { room: "a", listener: "bob" });
  const polled = await events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll" });
  say("a", "ann", "one");
  say("a", "bob", "bob's own words");
  say("b", "ann", "another room");
  // Connections drop, and then more is said than one stream sends before it ends and its client resumes.
  http.closeAllConnections();
  const burst = Array.from({ length: 100 }, (_, n) => `${n}`.padEnd(10_000));
  for (const text of burst) say("a", "cat", text);
  for (const subscription of [pushed, polled]) assert.deepEqual(await take(subscription, 101), ["one", ...burst]);
});

test("a subscription to a 2025 server is pushed its events, and ending it ends its session", async t => {
  const events = createEvents();
  const ended: string[] = [];
  const said = events.event<{ room: string }, { text: string }>("room.said", {
    inputSchema: z.object({ room: z.string() }),
    payloadSchema: z.object({ text: z.string() }),
    onUnsubscribe: ({ subscriptionId }) => { ended.push(subscriptionId); },
  });
  const { endpoint } = await serveLegacy(t, served(events));
  const methods: string[] = [];
  const counting: typeof fetch = (input, init) => {
    methods.push(init?.method ?? "GET");
    return fetch(input, init);
  };
  // A 2025 server answers its initialization as a stream too, which is not the subscription's.
  const subscription = await connect(t, endpoint, { fetch: counting }).subscribe("room.said", { room: "a" });
  said.emit({ text: "one" }, { eventId: "one" });
  assert.deepEqual(await take(subscription, 1), ["one"]);
  await until(() => ended.length === 1 && methods.includes("DELETE"));
});

test("the client lists every event type a page at a time, and is refused what the app does not offer", async t => {
  const { events, factory, say } = rooms();
  // A page holds a hundred types, so the last of these is on the second.
  const clocks = Array.from({ length: 100 }, (_, index) => `clock.${index}`);
  for (const name of clocks) events.event(name, { inputSchema: z.object({}), payloadSchema: z.object({}) });
  const { endpoint } = await serve(t, factory);
  const app = connect(t, endpoint);
  assert.deepEqual((await app.list()).map(({ name }) => name), ["room.said", ...clocks]);
  await assert.rejects(app.subscribe("room.left", {}), /no event room.left/);
  await assert.rejects(app.subscribe("room.said", { room: 1 }), /Invalid arguments/);
  // A contract's schema for the event's data is held against what arrives.
  const typed = connect(t, endpoint, { contract: { tools: [], events: [{ name: "room.said", payloadSchema: { type: "object", required: ["volume"] } }] } });
  const strict = await typed.subscribe("room.said", { room: "a", listener: "bob" });
  say("a", "ann", "quietly");
  await assert.rejects(take(strict, 1), /Invalid data of app room.said/);
});

test("the server speaks the messages of the Events design sketch", async t => {
  const { events, factory, said, say } = rooms();
  events.event("alarm.rang", { inputSchema: z.object({}), payloadSchema: z.object({}), delivery: ["push"], _meta: { "example.com/sound": "bell" } });
  const { endpoint } = await serve(t, factory);
  const { client, heard, request } = await wire(t, endpoint);
  assert.deepEqual(client.getServerCapabilities()?.extensions, { "io.modelcontextprotocol/events": { listChanged: false } });
  const { events: [listed, alarm] } = await request("events/list", {});
  assert.deepEqual([listed.name, listed.delivery, listed.inputSchema.required, alarm._meta], ["room.said", ["poll", "push"], ["room", "listener"], { "example.com/sound": "bell" }]);
  await assert.rejects(request("events/poll", { name: "alarm.rang", arguments: {}, cursor: null }), refusedWith(-32026, { feature: "deliveryMode", value: "poll" }));

  // A poll from null returns no events, and the cursor to poll from next.
  const subscription = { name: "room.said", arguments: { room: "a", listener: "bob" } };
  const start = await request("events/poll", { ...subscription, cursor: null });
  assert.deepEqual([start.events, start.nextPollMs], [[], 1000]);
  say("a", "ann", "one");
  const { events: [polled] } = await request("events/poll", { ...subscription, cursor: start.cursor });
  assert.deepEqual(polled, { eventId: "one", name: "room.said", timestamp: polled.timestamp, data: { text: "one" } });

  // A stream is confirmed first, sends each event with the cursor after it, and ends with its final result: once it
  // has sent about a megabyte, for its client to resume from its cursor, or when the server ends it.
  const stream = request("events/stream", { ...subscription, cursor: start.cursor });
  await until(() => heard.length === 2);
  const long = request("events/stream", { name: "room.said", arguments: { room: "b", listener: "bob" }, cursor: said.cursor() });
  for (let n = 0; n < 100; n++) say("b", "ann", `${n}`.padEnd(10_000));
  assert.deepEqual(Object.keys(await long), ["_meta"]);
  said.remove();
  assert.deepEqual(Object.keys(await stream), ["_meta"]);
  const [{ id }, { cursor }] = heard;
  assert.deepEqual(heard.filter(message => message.id === id), [
    { kind: "active", id, cursor: start.cursor, truncated: false },
    { kind: "event", id, ...polled, cursor },
    { kind: "terminated", id, error: { code: -32023, message: "NotFound", data: { kind: "event" } } },
  ]);
});

test("a stream that falls behind what is kept is told of the gap, and carries on", async t => {
  const { factory, say } = rooms();
  const { endpoint } = await serve(t, factory);
  let gaps = 0;
  const subscription = await connect(t, endpoint).subscribe("room.said", { room: "a", listener: "bob" }, { onGap: () => gaps++ });
  // Events are kept for ten minutes, which the test's clock passes before the stream reads them.
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  say("a", "ann", "one");
  t.mock.timers.tick(11 * 60_000);
  say("a", "ann", "two");
  t.mock.timers.reset();
  assert.deepEqual(await take(subscription, 1), ["two"]);
  assert.equal(gaps, 1);
});

test("a subscription's open stream is sent everything emitted to it, even more than is kept, with no gap", async t => {
  // Ten thousand events are kept, and all of these are emitted before the stream sends any: as it is set up, or after.
  const burst = Array.from({ length: 10_100 }, (_, n) => `${n}`);
  for (const opening of [true, false]) {
    let id: string | undefined;
    const { factory, say } = rooms({ onSubscribe: ({ subscriptionId }) => {
      id = subscriptionId;
      if (opening) for (const text of burst) say("a", "ann", text, id);
    } });
    // Signed in, so the stream that resumes after one has sent its budget is the same subscription.
    const { endpoint } = await serve(t, factory, signedIn);
    let gaps = 0;
    const subscription = await connect(t, endpoint).subscribe("room.said", { room: "a", listener: "bob" }, { onGap: () => gaps++ });
    if (!opening) for (const text of burst) say("a", "ann", text, id);
    const [first, ...rest] = burst;
    assert.deepEqual(await next(subscription, 1), [first]);
    assert.deepEqual(await take(subscription, rest.length), rest);
    assert.equal(gaps, 0);
  }
});

test("a subscription from the cursor read with a snapshot hears every change after the snapshot and none before", async t => {
  const { factory, said, say } = rooms();
  const { endpoint } = await serve(t, factory);
  const state: string[] = [];
  const tell = (text: string) => { state.push(text); say("a", "ann", text); };
  tell("in the snapshot");
  // What a tool would return: the state and the cursor, read in the same synchronous run.
  const snapshot = { state: [...state], cursor: said.cursor() };
  tell("after the snapshot");
  tell("later still");
  const subscription = await connect(t, endpoint).subscribe("room.said", { room: "a", listener: "bob" }, { cursor: snapshot.cursor });
  tell("once subscribed");
  assert.deepEqual([...snapshot.state, ...await take(subscription, 3)], state);
});

test("what onSubscribe emits to its subscription reaches it first, by push or poll, and a cursor from before a restart is a gap", async t => {
  const { factory, say } = rooms({ onSubscribe: ({ subscriptionId, arguments: { room } }) => say(room, "host", "welcome", subscriptionId) });
  const { endpoint } = await serve(t, factory, signedIn);
  const events = connect(t, endpoint);
  const gaps: string[] = [];
  // A cursor from another process, as from before the server restarted, names nothing here.
  for (const cursor of [undefined, rooms().said.cursor()]) {
    for (const delivery of ["push", "poll"] as const) {
      const room = `${delivery} ${cursor ? "resumed" : "fresh"}`;
      const subscription = await events.subscribe("room.said", { room, listener: "bob" }, { delivery, cursor, onGap: () => gaps.push(room) });
      say(room, "ann", "hello");
      assert.deepEqual(await take(subscription, 2), ["welcome", "hello"]);
    }
  }
  assert.deepEqual(gaps, ["push resumed", "poll resumed"]);
});

test("a signed-in caller's subscription is one per arguments, set up once while held, and set up again under the same id when its streams drop", async t => {
  const begun: string[] = [];
  const ended: string[] = [];
  const { factory, say } = rooms({
    onSubscribe: ({ subscriptionId }) => { begun.push(subscriptionId); },
    onUnsubscribe: ({ subscriptionId }) => { ended.push(subscriptionId); },
  });
  const { endpoint, http } = await serve(t, factory, signedIn);
  const events = connect(t, endpoint);
  // However the arguments are ordered.
  const first = await events.subscribe("room.said", { room: "a", listener: "bob" });
  const second = await events.subscribe("room.said", { listener: "bob", room: "a" });
  const other = await events.subscribe("room.said", { room: "a", listener: "cat" });
  const [bob, cat] = begun;
  // Emitted to bob's subscription, which is not asked whether bob hears his own words.
  say("a", "bob", "for bob", bob);
  assert.deepEqual([await next(first, 1), await next(second, 1)], [["for bob"], ["for bob"]]);
  // It ends with its last stream.
  first.cancel();
  other.cancel();
  await until(() => ended.length);
  assert.deepEqual(ended, [cat]);

  // What is emitted to it while its stream is down arrives once the stream is back.
  const heard = next(second, 1);
  http.closeAllConnections();
  say("a", "bob", "while away", bob);
  assert.deepEqual(await heard, ["while away"]);
  assert.deepEqual(begun, [bob, cat, bob]);
  // Polls share a subscription too.
  await events.subscribe("room.said", { room: "b", listener: "bob" }, { delivery: "poll" });
  await events.subscribe("room.said", { listener: "bob", room: "b" }, { delivery: "poll" });
  assert.equal(begun.length, 4);
});

test("callers without an identity do not share a subscription, so what is emitted to one's reaches it alone", async t => {
  const begun: string[] = [];
  const { factory, say } = rooms({ onSubscribe: ({ subscriptionId }) => { begun.push(subscriptionId); } });
  const { endpoint } = await serve(t, factory);
  const events = connect(t, endpoint);
  const first = await events.subscribe("room.said", { room: "a", listener: "bob" });
  const second = await events.subscribe("room.said", { room: "a", listener: "bob" });
  say("a", "ann", "for the first", begun[0]);
  say("a", "ann", "for both");
  assert.deepEqual([await take(first, 2), await take(second, 1)], [["for the first", "for both"], ["for both"]]);
});

test("a subscriber's value is shown while it subscribes, survives a reconnect within its linger, and leaves its linger after its last stream ends or it was last set", { timeout: 10_000 }, async t => {
  const ended: string[] = [];
  const { factory, said } = rooms({ onUnsubscribe: ({ subscriptionId }) => { ended.push(subscriptionId); } });
  const status = said.presence<string>(({ room, listener }, text) => ({ room, speaker: listener, text: text ?? `${listener} left` }));
  const { endpoint } = await serve(t, factory);
  const events = connect(t, endpoint);
  const leave = async (subscription: Subscription) => {
    const before = ended.length;
    subscription.cancel();
    await until(() => ended.length > before);
  };
  const bob = { room: "a", listener: "bob" };
  const told = (await events.subscribe("room.said", bob))[Symbol.asyncIterator]();
  const hear = async (count: number) => {
    const texts: string[] = [];
    while (texts.length < count) texts.push(((await told.next()).value.data as Said).text);
    return texts;
  };
  const cat = { room: "a", listener: "cat" };
  // One subscriber's overlapping streams: a caller without an identity holds each as a subscription of its own.
  const streams = [await events.subscribe("room.said", cat), await events.subscribe("room.said", cat)];
  // Timers run in the order they are due, so a linger this short would end before each wait that follows it.
  status.set(cat, "typing", 1);
  await sleep(20);
  await leave(streams[0]!);
  await sleep(20);
  assert.deepEqual([status.seen(bob), status.seen(cat)], [["typing"], []]);
  // Its last stream ends, and it comes back within the linger.
  status.set(cat, "idle", 500);
  await leave(streams[1]!);
  const left = Date.now();
  const back = await events.subscribe("room.said", cat);
  await sleep(left + 600 - Date.now());
  assert.deepEqual(status.seen(bob), ["idle"]);
  await leave(back);
  assert.deepEqual(await hear(3), ["typing", "idle", "cat left"]);

  // A caller that cannot subscribe keeps its value by setting it again.
  const dan = { room: "a", listener: "dan" };
  status.set(dan, "here", 100);
  await sleep(60);
  status.set(dan, "still here", 100);
  await sleep(60);
  assert.deepEqual(status.seen(bob), ["still here"]);
  assert.deepEqual(await hear(3), ["here", "still here", "dan left"]);
  assert.deepEqual(status.seen(bob), []);
});

test("a subscription the app ends is told why: a stream after what was emitted to it, unless its caller lost access, and a poll when it next polls", async t => {
  const ids = new Map<string, string>();
  const { factory, said, say } = rooms({ onSubscribe: ({ subscriptionId, arguments: { listener } }) => { ids.set(listener, subscriptionId); } });
  const { endpoint } = await serve(t, factory);
  const events = connect(t, endpoint);
  const bob = await events.subscribe("room.said", { room: "a", listener: "bob" });
  const cat = await events.subscribe("room.said", { room: "a", listener: "cat" });
  const dan = await events.subscribe("room.said", { room: "a", listener: "dan" }, { delivery: "poll" });
  say("a", "ann", "last words");
  said.terminate(ids.get("bob"), { code: -32000, message: "Closed", data: { reason: "The room closed" } });
  // Forbidden, the default, says the caller lost access, so nothing more is sent.
  said.terminate(ids.get("cat"));
  said.terminate(ids.get("dan"));
  say("a", "ann", "too late");
  assert.deepEqual(await next(bob, 1), ["last words"]);
  await assert.rejects(next(bob, 1), refusedWith(-32000, { reason: "The room closed" }));
  await assert.rejects(next(cat, 1), refusedWith(-32024));
  await assert.rejects(next(dan, 1), refusedWith(-32024));
});

test("a subscription the caller may not have is refused, and one it no longer may have is ended", { timeout: 30_000 }, async t => {
  const revoked = new Set(["eve"]);
  const { factory } = rooms({ authorize: ({ listener }) => !revoked.has(listener) });
  const { endpoint } = await serve(t, factory);
  const events = connect(t, endpoint);
  // Lost access is noticed at the next heartbeat, every thirty seconds, which the test's clock jumps to.
  t.mock.timers.enable({ apis: ["setInterval"] });
  await assert.rejects(events.subscribe("room.said", { room: "a", listener: "eve" }), refusedWith(-32024));

  const cat = await events.subscribe("room.said", { room: "a", listener: "cat" });
  // Every delivery mode counts against the thousand a caller may hold: these callers have no identity, so are one.
  const { request } = await wire(t, endpoint);
  for (let index = 0; index < 999; index++) await request("events/poll", { name: "room.said", arguments: { room: "a", listener: `filler ${index}` }, cursor: null });
  await assert.rejects(events.subscribe("room.said", { room: "a", listener: "fay" }, { delivery: "poll" }), refusedWith(-32025, { limit: "subscriptionsPerCaller", max: 1000 }));

  revoked.add("cat");
  let noticed = false;
  const lost = assert.rejects(take(cat, 1), refusedWith(-32024)).finally(() => { noticed = true; });
  await until(() => { t.mock.timers.tick(30_000); return noticed; });
  await lost;
});

test("a stream left while its subscription is being set up is torn down once the setup finishes", async t => {
  let release: (() => void) | undefined;
  let ended = false;
  const { factory } = rooms({
    onSubscribe: () => new Promise<void>(resolve => { release = resolve; }),
    onUnsubscribe: () => { ended = true; },
  });
  const { endpoint } = await serve(t, factory);
  const leaving = new AbortController();
  const subscribing = connect(t, endpoint).subscribe("room.said", { room: "a", listener: "bob" }, { signal: leaving.signal });
  await until(() => release);
  leaving.abort();
  await assert.rejects(subscribing);
  release!();
  await until(() => ended);
});

test("an event that cannot be shaped for a subscription is skipped for it, and what follows still arrives", async t => {
  const events = createEvents();
  const noted = events.event<Record<string, never>, { text: string }>("note.added", {
    inputSchema: z.object({}),
    payloadSchema: z.object({ text: z.string() }),
    transform: ({ text }) => {
      if (text === "unshapeable") throw new Error("cannot shape");
      // What cannot be sent as JSON fails the same way.
      if (text === "circular") { const loop: Record<string, unknown> = {}; loop.loop = loop; return loop; }
      return { text };
    },
  });
  const { endpoint } = await serve(t, served(events));
  const subscription = await connect(t, endpoint).subscribe("note.added", {});
  // Each event skipped is logged.
  t.mock.method(console, "error", () => {});
  for (const text of ["unshapeable", "circular", "after"]) noted.emit({ text }, { eventId: text });
  assert.deepEqual(await take(subscription, 1), ["after"]);
});

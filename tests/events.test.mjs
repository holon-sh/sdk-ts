import { test } from "node:test";
import assert from "node:assert/strict";
import { Client, InMemoryTransport, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer, ProtocolError } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { createEvents } from "holon-sh/events";
import { serve } from "./helpers.mjs";

const identity = { name: "test", version: "1.0.0" };

// A server whose rooms say things: a subscription names a room and hears what the others in it say.
function rooms(options, definition) {
  const events = createEvents(options);
  const said = events.event("room.said", {
    description: "Someone said something in a room",
    inputSchema: z.object({ room: z.string(), listener: z.string() }),
    payloadSchema: z.object({ text: z.string() }),
    match: ({ room, speaker }, args) => room === args.room && speaker !== args.listener,
    transform: ({ text }) => ({ text }),
    ...definition,
  });
  const factory = () => {
    const server = new McpServer({ name: "rooms", version: "1.0.0" });
    events.serve(server);
    return server;
  };
  return { factory, said, say: (room, speaker, text, to) => said.emit({ room, speaker, text }, { eventId: text, subscription: to }) };
}

// Reads from a subscription without ending it, as take does when it stops.
const iterators = new WeakMap();
async function next(subscription, count) {
  if (!iterators.has(subscription)) iterators.set(subscription, subscription[Symbol.asyncIterator]());
  const texts = [];
  while (texts.length < count) texts.push((await iterators.get(subscription).next()).value.data.text);
  return texts;
}

async function take(subscription, count) {
  const texts = [];
  for await (const { data } of subscription) if (texts.push(data.text) === count) break;
  return texts;
}

test("a subscription is pushed the events its arguments match, and resumes from its cursor when its stream drops", async t => {
  const { factory, say } = rooms();
  const { endpoint, http } = await serve(t, factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  assert.deepEqual((await app.events.list()).map(({ name, delivery }) => ({ name, delivery })), [{ name: "room.said", delivery: ["poll", "push"] }]);

  say("a", "ann", "before the subscription");
  const subscription = await app.events.subscribe("room.said", { room: "a", listener: "bob" });
  assert.equal(subscription.delivery, "push");
  say("a", "ann", "one");
  say("a", "bob", "bob's own words");
  say("b", "ann", "another room");
  const heard = take(subscription, 3);
  await new Promise(resolve => setTimeout(resolve, 50));
  // The stream drops, and what is said meanwhile is delivered once it is back.
  http.closeAllConnections();
  say("a", "ann", "two");
  say("a", "cat", "three");
  assert.deepEqual(await heard, ["one", "two", "three"]);

  await assert.rejects(app.events.subscribe("room.left", {}), /no event room.left/);
  await assert.rejects(app.events.subscribe("room.said", { room: 1 }), /Invalid arguments|status|400/);
});

test("a poll returns what happened since its cursor, and says when events were skipped", async t => {
  const first = rooms();
  const { endpoint } = await serve(t, first.factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  const subscription = await app.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll" });
  first.say("a", "ann", "one");
  first.say("a", "ann", "two");
  assert.deepEqual(await take(subscription, 2), ["one", "two"]);

  // A server that has restarted does not know the cursor of the one before it.
  const second = rooms();
  const later = await serve(t, second.factory);
  const { rooms: restarted } = createApps(identity, { rooms: null }, { rooms: { endpoint: later.endpoint } });
  t.after(() => restarted.close());
  let gaps = 0;
  const resumed = await restarted.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll", cursor: subscription.cursor, onGap: () => gaps++ });
  second.say("a", "ann", "three");
  assert.deepEqual(await take(resumed, 1), ["three"]);
  assert.equal(gaps, 1);

  // A contract's schema for the event's data is held against what arrives.
  const contract = { tools: [], events: [{ name: "room.said", payloadSchema: { type: "object", required: ["volume"] } }] };
  const { rooms: typed } = createApps(identity, { rooms: contract }, { rooms: { endpoint: later.endpoint } });
  t.after(() => typed.close());
  const strict = await typed.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll" });
  second.say("a", "ann", "four");
  await assert.rejects(take(strict, 1), /Invalid data of rooms room.said/);
});

test("the server speaks the messages of the Events design sketch", async t => {
  const { factory, say } = rooms({ heartbeat: 20 });
  const { endpoint } = await serve(t, factory);
  const client = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => client.close());
  const loose = z.looseObject({});
  assert.deepEqual(client.getServerCapabilities().extensions, { "io.modelcontextprotocol/events": { listChanged: false } });
  const { events: [type] } = await client.request({ method: "events/list", params: {} }, loose);
  assert.deepEqual(Object.keys(type), ["name", "description", "delivery", "inputSchema", "payloadSchema"]);
  assert.deepEqual(type.inputSchema.required, ["room", "listener"]);

  const poll = cursor => client.request({ method: "events/poll", params: { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor } }, loose);
  const { _meta, ...start } = await poll(null);
  assert.deepEqual({ ...start, cursor: typeof start.cursor }, { events: [], cursor: "string", truncated: false, hasMore: false, nextPollMs: 1000 });
  say("a", "ann", "one");
  const { events: [polled] } = await poll(start.cursor);
  assert.deepEqual(Object.keys(polled), ["eventId", "name", "timestamp", "data"]);
  assert.equal((await poll("someone else's cursor")).truncated, true);

  const received = [];
  for (const kind of ["active", "event", "heartbeat"])
    client.setNotificationHandler(`notifications/events/${kind}`, { params: loose }, params => received.push({ kind, ...params }));
  const stop = new AbortController();
  const stream = client.request({ method: "events/stream", params: { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor: start.cursor } }, loose, { signal: stop.signal });
  while (!received.some(({ kind }) => kind === "heartbeat")) await new Promise(resolve => setTimeout(resolve, 5));
  stop.abort();
  await assert.rejects(stream);
  const [active, event, heartbeat] = ["active", "event", "heartbeat"].map(kind => received.find(message => message.kind === kind));
  const subscriptionId = active._meta["io.modelcontextprotocol/subscriptionId"];
  assert.deepEqual(active, { kind: "active", cursor: start.cursor, truncated: false, _meta: { "io.modelcontextprotocol/subscriptionId": subscriptionId } });
  assert.deepEqual(event, { kind: "event", ...polled, cursor: event.cursor, _meta: active._meta });
  assert.deepEqual(heartbeat, { kind: "heartbeat", cursor: event.cursor, _meta: active._meta });
  assert.equal(received[0].kind, "active");
});

const loose = z.looseObject({});

// A client that speaks the wire messages, and keeps every events notification it hears.
async function wire(t, endpoint) {
  const client = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const streams = new AbortController();
  t.after(() => { streams.abort(); return client.close(); });
  const heard = [];
  for (const kind of ["active", "event", "heartbeat", "error", "terminated"])
    client.setNotificationHandler(`notifications/events/${kind}`, { params: loose }, ({ _meta, ...params }) => heard.push({ kind, id: _meta["io.modelcontextprotocol/subscriptionId"], ...params }));
  const request = (method, params) => client.request({ method, params }, loose, method === "events/stream" ? { signal: streams.signal } : {});
  return { client, heard, request };
}

async function until(condition) {
  for (const deadline = Date.now() + 5000; !condition();) {
    if (Date.now() > deadline) throw new Error("Timed out waiting");
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

const refusedWith = (code, data) => error => {
  assert.equal(error.code, code);
  if (data) assert.deepEqual(error.data, data);
  return true;
};

// A server over a ledger that keeps its own history: a cursor is a position in the ledger, so it means the same to
// any process that reads it.
function ledgers(log, options, definition) {
  const events = createEvents(options);
  const entry = events.event("ledger.entry", {
    inputSchema: z.object({ account: z.string() }),
    payloadSchema: z.object({ amount: z.number() }),
    check: async (cursor, { account }) => {
      if (log.unavailable) throw new ProtocolError(-32603, "UpstreamError", { reason: "the ledger is unavailable" });
      if (cursor === null) return { events: [], cursor: String(log.length) };
      const found = log.map((line, index) => ({ ...line, cursor: String(index + 1) })).slice(Number(cursor)).filter(line => line.account === account);
      return { events: found.map(({ id, at, amount, cursor }) => ({ eventId: id, timestamp: at, data: { amount }, cursor })), cursor: String(log.length) };
    },
    ...definition,
  });
  const factory = () => {
    const server = new McpServer({ name: "ledger", version: "1.0.0" });
    events.serve(server);
    return server;
  };
  return { factory, entry };
}

test("a check function answers polls from its source's own cursor, cut short by maxEvents and bounded by maxAgeMs", async t => {
  const log = [];
  const write = (id, account, amount, at = new Date().toISOString()) => log.push({ id, account, amount, at });
  const { endpoint } = await serve(t, ledgers(log, {}, { interval: 5000 }).factory);
  const { request } = await wire(t, endpoint);
  const poll = (cursor, more) => request("events/poll", { name: "ledger.entry", arguments: { account: "a" }, cursor, ...more });
  write("before", "a", 1);
  const { _meta, ...start } = await poll(null);
  assert.deepEqual(start, { events: [], cursor: "1", truncated: false, hasMore: false, nextPollMs: 5000 });

  write("one", "a", 10);
  write("elsewhere", "b", 20);
  write("two", "a", 30);
  const first = await poll(start.cursor, { maxEvents: 1 });
  assert.deepEqual([first.events.map(event => event.eventId), first.cursor, first.hasMore], [["one"], "2", true]);
  const second = await poll(first.cursor, { maxEvents: 1 });
  assert.deepEqual([second.events.map(event => event.eventId), second.cursor, second.hasMore], [["two"], "4", false]);
  assert.deepEqual(second.events[0], { eventId: "two", name: "ledger.entry", timestamp: log[3].at, data: { amount: 30 } });

  write("long ago", "a", 40, new Date(Date.now() - 3_600_000).toISOString());
  write("just now", "a", 50);
  const recent = await poll(second.cursor, { maxAgeMs: 60_000 });
  assert.deepEqual([recent.events.map(event => event.eventId), recent.truncated], [["just now"], true]);

  // Another process reading the same ledger resumes from the same cursor, with nothing skipped.
  const { endpoint: other } = await serve(t, ledgers(log).factory);
  write("three", "a", 60);
  const resumed = await (await wire(t, other)).request("events/poll", { name: "ledger.entry", arguments: { account: "a" }, cursor: recent.cursor });
  assert.deepEqual([resumed.events.map(event => event.eventId), resumed.truncated], [["three"], false]);
});

test("a stream asks the check function every interval, pushes what is emitted at once, and is told of a check that fails", async t => {
  const log = [];
  const write = id => log.push({ id, account: "a", amount: 1, at: new Date().toISOString() });
  const { factory, entry } = ledgers(log, { heartbeat: 60_000 }, { interval: 20 });
  const { endpoint } = await serve(t, factory);
  const { heard, request } = await wire(t, endpoint);
  request("events/stream", { name: "ledger.entry", arguments: { account: "a" }, cursor: null }).catch(() => {});
  await until(() => heard.length);
  write("one");
  await until(() => heard.some(({ eventId }) => eventId === "one"));
  // What is emitted goes out before the next check, at the cursor the stream has reached.
  entry.emit({ amount: 2 }, { eventId: "pushed" });
  await until(() => heard.some(({ eventId }) => eventId === "pushed"));
  log.unavailable = true;
  await until(() => heard.some(({ kind }) => kind === "error"));
  log.unavailable = false;
  write("two");
  await until(() => heard.some(({ eventId }) => eventId === "two"));
  // The check fails each interval while the ledger is down; the stream is told, and carries on.
  const told = heard.filter(({ kind }, index) => kind !== "error" || heard.findIndex(({ kind }) => kind === "error") === index);
  assert.deepEqual(told.map(({ kind, eventId, cursor, truncated, error }) => [kind, eventId ?? error ?? truncated, cursor]), [
    ["active", false, "0"],
    ["event", "one", "1"],
    ["event", "pushed", "1"],
    ["error", { code: -32603, message: "UpstreamError", data: { reason: "the ledger is unavailable" } }, undefined],
    ["event", "two", "2"],
  ]);
});

test("a subscription keeps its id across streams, reconnects and polls, is set up once while held, and has what was emitted to it", async t => {
  const begun = [];
  const ended = [];
  const onSubscribe = ({ id, delivery, arguments: args }) => {
    begun.push({ id, delivery, args });
    return () => ended.push(id);
  };
  const { factory, say } = rooms({ pollLease: 1200 }, { onSubscribe, interval: 100 });
  // Every request comes from one signed-in user, through one client.
  const { endpoint, http } = await serve(t, factory, request => { request.auth = { token: "token", clientId: "page", scopes: ["read"], extra: { iss: "https://issuer.example", sub: "ann" } }; });
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());

  // Two streams of one caller with the same arguments are one subscription, set up once, and both receive.
  const first = await app.events.subscribe("room.said", { room: "a", listener: "bob" });
  const second = await app.events.subscribe("room.said", { listener: "bob", room: "a" });
  const other = await app.events.subscribe("room.said", { room: "a", listener: "cat" });
  assert.deepEqual(begun.map(({ delivery, args }) => ({ delivery, args })), [{ delivery: "push", args: { room: "a", listener: "bob" } }, { delivery: "push", args: { room: "a", listener: "cat" } }]);
  const [bob, cat] = begun.map(({ id }) => id);
  // Emitted to bob's subscription alone, and not asked whether bob hears his own words.
  say("a", "bob", "for bob", bob);
  say("a", "ann", "for everyone");
  assert.deepEqual(await next(first, 2), ["for bob", "for everyone"]);
  assert.deepEqual(await next(second, 2), ["for bob", "for everyone"]);
  assert.deepEqual(await next(other, 1), ["for everyone"]);
  first.cancel();
  other.cancel();
  await until(() => ended.length === 1);
  assert.deepEqual(ended, [cat]);

  // What is emitted to it while its stream is down is delivered once the stream is back, under the same id.
  const heard = next(second, 1);
  http.closeAllConnections();
  say("a", "bob", "while away", bob);
  assert.deepEqual(await heard, ["while away"]);
  // Its last stream dropped, so it was torn down and set up again when the stream came back, with the same id.
  assert.deepEqual(begun.map(({ id }) => id), [bob, cat, bob]);
  second.cancel();
  await until(() => ended.length === 3);

  // Polls for the same arguments by the same caller are one subscription, which ends once they stop.
  const polled = await app.events.subscribe("room.said", { room: "b", listener: "bob" }, { delivery: "poll" });
  const again = await app.events.subscribe("room.said", { listener: "bob", room: "b" }, { delivery: "poll" });
  assert.deepEqual(begun.slice(3).map(({ delivery }) => delivery), ["poll"]);
  polled.cancel();
  again.cancel();
  await until(() => ended.length === 4);
  assert.equal(ended[3], begun[3].id);
});

test("callers without an identity do not share a subscription, and what is emitted to one's stream does not reach the other", async t => {
  const begun = [];
  const { factory, say } = rooms({}, { onSubscribe: ({ id }) => { begun.push(id); } });
  const { endpoint } = await serve(t, factory);
  const [first, second] = [await wire(t, endpoint), await wire(t, endpoint)];
  for (const { request } of [first, second]) {
    request("events/stream", { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor: null }).catch(() => {});
  }
  await until(() => first.heard.length && second.heard.length);
  assert.equal(new Set(begun).size, 2);
  const firstId = begun[0];
  say("a", "ann", "for one stream", firstId);
  say("a", "ann", "for both");
  await until(() => [first, second].every(({ heard }) => heard.some(({ eventId }) => eventId === "for both")));
  const said = ({ heard }) => heard.filter(({ kind }) => kind === "event").map(({ eventId }) => eventId);
  // Which stream began first is not known, so the one that hears the targeted event must be the one it was for.
  assert.deepEqual([said(first), said(second)].sort((x, y) => y.length - x.length), [["for one stream", "for both"], ["for both"]]);
});

test("an event that cannot be shaped for a subscription is skipped for it, told once on a stream, and what follows still arrives", async t => {
  const events = createEvents({ heartbeat: 60_000 });
  const noted = events.event("note.added", {
    inputSchema: z.object({}),
    payloadSchema: z.object({ text: z.string() }),
    transform: ({ text }) => {
      if (text === "unshapeable") throw new Error("cannot shape");
      // What cannot be sent as JSON fails the same way.
      if (text === "circular") { const loop = {}; loop.loop = loop; return loop; }
      return { text };
    },
  });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "notes", version: "1.0.0" });
    events.serve(server);
    return server;
  });
  const { heard, request } = await wire(t, endpoint);
  const start = noted.cursor();
  request("events/stream", { name: "note.added", arguments: {}, cursor: null }).catch(() => {});
  await until(() => heard.length);
  const logged = t.mock.method(console, "error", () => {});
  for (const text of ["unshapeable", "circular", "after"]) noted.emit({ text }, { eventId: text });
  await until(() => heard.some(({ eventId }) => eventId === "after"));
  noted.emit({ text: "later" }, { eventId: "later" });
  await until(() => heard.some(({ eventId }) => eventId === "later"));
  assert.deepEqual(heard.slice(1).map(({ kind, eventId, error }) => kind === "error" ? error.data.eventId : eventId), ["unshapeable", "circular", "after", "later"]);
  assert.equal(logged.mock.callCount(), 2);
  const polled = await request("events/poll", { name: "note.added", arguments: {}, cursor: start });
  assert.deepEqual(polled.events.map(({ eventId }) => eventId), ["after", "later"]);
});

test("a stream left while its subscription is being set up is torn down and frees its place", async t => {
  let release;
  const ended = [];
  const { factory } = rooms({ maxSubscriptions: 1 }, {
    onSubscribe: async ({ id }) => {
      if (!release) await new Promise(resolve => { release = resolve; });
      return () => ended.push(id);
    },
  });
  const { endpoint } = await serve(t, factory);
  const { client } = await wire(t, endpoint);
  const leaving = new AbortController();
  const stream = client.request({ method: "events/stream", params: { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor: null } }, loose, { signal: leaving.signal });
  await until(() => release);
  leaving.abort();
  await assert.rejects(stream);
  // The server hears that the request was left before the setup finishes.
  await new Promise(resolve => setTimeout(resolve, 200));
  release();
  await until(() => ended.length === 1);
  const { request } = await wire(t, endpoint);
  assert.equal((await request("events/poll", { name: "room.said", arguments: { room: "a", listener: "cat" }, cursor: null })).truncated, false);
});

test("a stream on a check function is confirmed before anything else is said on it, and a source without positions delivers what is new at each check", async t => {
  const fresh = [];
  let slow = true;
  const events = createEvents({ heartbeat: 10 });
  events.event("bell.rang", {
    inputSchema: z.object({}),
    payloadSchema: z.object({ rings: z.number() }),
    interval: 20,
    check: async () => {
      if (slow) await new Promise(resolve => setTimeout(resolve, 100));
      slow = false;
      return { events: fresh.splice(0).map(rings => ({ eventId: String(rings), data: { rings } })), cursor: null };
    },
  });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "bell", version: "1.0.0" });
    events.serve(server);
    return server;
  });
  const { heard, request } = await wire(t, endpoint);
  request("events/stream", { name: "bell.rang", arguments: {}, cursor: null }).catch(() => {});
  await until(() => heard.length);
  assert.deepEqual(heard[0], { kind: "active", id: heard[0].id, cursor: null, truncated: false });
  fresh.push(1, 2);
  await until(() => heard.some(({ eventId }) => eventId === "2"));
  fresh.push(3);
  assert.deepEqual((await request("events/poll", { name: "bell.rang", arguments: {}, cursor: null })).events.map(({ eventId }) => eventId), ["3"]);
});

test("a subscription the caller may not have is refused, and one the app ends is told why on its stream or its next poll", async t => {
  const revoked = new Set(["eve"]);
  const subscriptions = new Map();
  const { factory, said, say } = rooms({ heartbeat: 30, maxSubscriptions: 3 }, {
    authorize: ({ listener }) => !revoked.has(listener),
    onSubscribe: ({ id, arguments: { listener } }) => { subscriptions.set(listener, id); },
  });
  const { endpoint } = await serve(t, factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  await assert.rejects(app.events.subscribe("room.said", { room: "a", listener: "eve" }), refusedWith(-32024));

  const bob = await app.events.subscribe("room.said", { room: "a", listener: "bob" });
  const cat = await app.events.subscribe("room.said", { room: "a", listener: "cat" });
  const dan = await app.events.subscribe("room.said", { room: "a", listener: "dan" }, { delivery: "poll" });
  // Every delivery mode counts against the limit.
  await assert.rejects(app.events.subscribe("room.said", { room: "a", listener: "fay" }, { delivery: "poll" }), refusedWith(-32025, { limit: "subscriptions", max: 3 }));

  said.end(subscriptions.get("bob"), { code: -32024, message: "Forbidden", data: { reason: "Left the room" } });
  await assert.rejects(take(bob, 1), refusedWith(-32024, { reason: "Left the room" }));
  // Access lost is noticed at the next heartbeat.
  revoked.add("cat");
  await assert.rejects(take(cat, 1), refusedWith(-32024));
  said.end(subscriptions.get("dan"));
  say("a", "ann", "too late");
  await assert.rejects(take(dan, 1), refusedWith(-32024));
});

test("events/list pages through the event types, and removing one ends its subscriptions and tells clients the list changed", async t => {
  const events = createEvents({ listChanged: true, pageSize: 1 });
  const schemas = { inputSchema: z.object({}), payloadSchema: z.object({}) };
  const alarm = events.event("alarm.rang", { ...schemas, delivery: ["push"], _meta: { "example.com/sound": "bell" } });
  events.event("door.opened", schemas);
  const factory = () => {
    const server = new McpServer({ name: "house", version: "1.0.0" });
    events.serve(server);
    return server;
  };
  const { endpoint } = await serve(t, factory);
  const { client, heard, request } = await wire(t, endpoint);
  assert.deepEqual(client.getServerCapabilities().extensions, { "io.modelcontextprotocol/events": { listChanged: true } });
  const first = await request("events/list", {});
  assert.deepEqual(first.events.map(({ name, delivery, _meta }) => ({ name, delivery, _meta })), [{ name: "alarm.rang", delivery: ["push"], _meta: { "example.com/sound": "bell" } }]);
  const second = await request("events/list", { cursor: first.nextCursor });
  assert.deepEqual([second.events.map(({ name }) => name), second.nextCursor], [["door.opened"], undefined]);
  await assert.rejects(request("events/poll", { name: "alarm.rang", arguments: {}, cursor: null }), refusedWith(-32026, { feature: "deliveryMode", value: "poll" }));

  // A client whose connection lasts hears that the list changed.
  const [near, far] = InMemoryTransport.createLinkedPair();
  await factory().connect(near);
  const listening = new Client(identity);
  let changes = 0;
  listening.setNotificationHandler("notifications/events/list_changed", { params: loose.optional() }, () => changes++);
  await listening.connect(far);
  t.after(() => listening.close());

  const stream = request("events/stream", { name: "alarm.rang", arguments: {}, cursor: null });
  await until(() => heard.length);
  alarm.remove();
  // The server ends the stream, so it sends the final result.
  assert.deepEqual(Object.keys(await stream), ["_meta"]);
  assert.deepEqual(heard.at(-1), { kind: "terminated", id: heard[0].id, error: { code: -32023, message: "NotFound", data: { kind: "event" } } });
  await until(() => changes === 1);
  assert.deepEqual((await request("events/list", {})).events.map(({ name }) => name), ["door.opened"]);
  await assert.rejects(request("events/poll", { name: "alarm.rang", arguments: {}, cursor: null }), refusedWith(-32023, { kind: "event" }));
});

test("a stream owed events that are no longer kept is told of the gap, and carries on from what is kept", async t => {
  const { factory, say } = rooms({ keep: { events: 3 } });
  const { endpoint } = await serve(t, factory);
  const { heard, request } = await wire(t, endpoint);
  request("events/stream", { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor: null }).catch(() => {});
  await until(() => heard.length);
  for (const text of ["one", "two", "three", "four", "five"]) say("a", "ann", text);
  await until(() => heard.some(({ eventId }) => eventId === "five"));
  const [active, gap, ...rest] = heard;
  assert.deepEqual([active.truncated, gap.kind, gap.truncated], [false, "active", true]);
  assert.deepEqual(rest.map(({ eventId }) => eventId), ["three", "four", "five"]);
  // The gap's cursor is where the stream started again: what follows it is what was sent.
  const restarted = await request("events/poll", { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor: gap.cursor });
  assert.deepEqual([restarted.events.map(({ eventId }) => eventId), restarted.truncated], [["three", "four", "five"], false]);
});

test("a subscription from the cursor read with a snapshot hears every change after the snapshot and none before", async t => {
  const { factory, said, say } = rooms();
  const { endpoint } = await serve(t, factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  const state = [];
  const tell = text => { state.push(text); say("a", "ann", text); };
  tell("in the snapshot");
  // What a tool would return: the state and the cursor, read in the same synchronous run.
  const snapshot = { state: [...state], cursor: said.cursor() };
  tell("after the snapshot");
  tell("later still");
  const subscription = await app.events.subscribe("room.said", { room: "a", listener: "bob" }, { cursor: snapshot.cursor });
  tell("once subscribed");
  assert.deepEqual([...snapshot.state, ...await take(subscription, 3)], state);
});

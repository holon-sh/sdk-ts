import { test } from "node:test";
import assert from "node:assert/strict";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { createEvents, type EventDefinition, type EventsOptions } from "holon-sh/ext/events";
import { serve, serveLegacy } from "./helpers.ts";

const identity = { name: "test", version: "1.0.0" };
// Wire messages are checked by the assertions that read them.
const loose = z.any();
type Listener = { room: string; listener: string };
type Said = { room: string; speaker: string; text: string };

// A server whose rooms say things: a subscription names a room and hears what the others in it say.
function rooms(options: EventsOptions = {}, definition: Partial<EventDefinition<Listener, Said>> = {}) {
  const events = createEvents(options);
  const said = events.event<Listener, Said>("room.said", {
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
  return { factory, said, say: (room: string, speaker: string, text: string) => said.emit({ room, speaker, text }, { eventId: text }) };
}

async function take(subscription: AsyncIterable<{ data: any }>, count: number) {
  const texts: string[] = [];
  for await (const { data } of subscription) if (texts.push(data.text) === count) break;
  return texts;
}

test("a subscription is pushed the events its arguments match, and resumes from its cursor when its stream drops", async t => {
  const { factory, say } = rooms();
  const { endpoint, http } = await serve(t, factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  assert.deepEqual((await app.ext.events.list()).map(({ name, delivery }) => ({ name, delivery })), [{ name: "room.said", delivery: ["poll", "push"] }]);

  say("a", "ann", "before the subscription");
  const subscription = await app.ext.events.subscribe("room.said", { room: "a", listener: "bob" });
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

  await assert.rejects(app.ext.events.subscribe("room.left", {}), /no event room.left/);
  await assert.rejects(app.ext.events.subscribe("room.said", { room: 1 }), /Invalid arguments|status|400/);
});

test("a subscription to a 2025 server is pushed its events, and ending it ends its session", async t => {
  const events = createEvents();
  const said = events.event<{ room: string }, { text: string }>("room.said", {
    inputSchema: z.object({ room: z.string() }),
    payloadSchema: z.object({ text: z.string() }),
  });
  const { endpoint } = await serveLegacy(t, () => {
    const server = new McpServer({ name: "rooms", version: "1.0.0" });
    events.serve(server);
    return server;
  });
  const methods: string[] = [];
  const counting: typeof fetch = (input, init) => {
    methods.push(init?.method ?? "GET");
    return fetch(input, init);
  };
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint, fetch: counting } });
  t.after(() => app!.close());
  // A 2025 server answers its initialization as a stream too, which is not the subscription's.
  const subscription = await app!.ext.events.subscribe("room.said", { room: "a" });
  said.emit({ text: "one" }, { eventId: "one" });
  assert.deepEqual(await take(subscription, 1), ["one"]);
  for (const deadline = Date.now() + 5000; !methods.includes("DELETE");) {
    assert.ok(Date.now() < deadline, "the session was not ended");
    await new Promise(resolve => setTimeout(resolve, 5));
  }
});

test("a poll returns what happened since its cursor, and says when events were skipped", async t => {
  const first = rooms();
  const { endpoint } = await serve(t, first.factory);
  const { rooms: app } = createApps(identity, { rooms: null }, { rooms: { endpoint } });
  t.after(() => app.close());
  const subscription = await app.ext.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll" });
  first.say("a", "ann", "one");
  first.say("a", "ann", "two");
  assert.deepEqual(await take(subscription, 2), ["one", "two"]);

  // A server that has restarted does not know the cursor of the one before it.
  const second = rooms();
  const later = await serve(t, second.factory);
  const { rooms: restarted } = createApps(identity, { rooms: null }, { rooms: { endpoint: later.endpoint } });
  t.after(() => restarted.close());
  let gaps = 0;
  const resumed = await restarted.ext.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll", cursor: subscription.cursor, onGap: () => gaps++ });
  second.say("a", "ann", "three");
  assert.deepEqual(await take(resumed, 1), ["three"]);
  assert.equal(gaps, 1);

  // A contract's schema for the event's data is held against what arrives.
  const contract = { tools: [], events: [{ name: "room.said", payloadSchema: { type: "object", required: ["volume"] } }] };
  const { rooms: typed } = createApps(identity, { rooms: contract }, { rooms: { endpoint: later.endpoint } });
  t.after(() => typed.close());
  const strict = await typed.ext.events.subscribe("room.said", { room: "a", listener: "bob" }, { delivery: "poll" });
  second.say("a", "ann", "four");
  await assert.rejects(take(strict, 1), /Invalid data of rooms room.said/);
});

test("the server speaks the messages of the Events design sketch", async t => {
  const { factory, say } = rooms({ heartbeat: 20 });
  const { endpoint } = await serve(t, factory);
  const client = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => client.close());
  assert.deepEqual(client.getServerCapabilities()?.extensions, { "io.modelcontextprotocol/events": { listChanged: false } });
  const { events: [type] } = await client.request({ method: "events/list", params: {} }, loose);
  assert.deepEqual(Object.keys(type), ["name", "description", "delivery", "inputSchema", "payloadSchema"]);
  assert.deepEqual(type.inputSchema.required, ["room", "listener"]);

  const poll = (cursor: string | null) => client.request({ method: "events/poll", params: { name: "room.said", arguments: { room: "a", listener: "bob" }, cursor } }, loose);
  const { _meta, ...start } = await poll(null);
  assert.deepEqual({ ...start, cursor: typeof start.cursor }, { events: [], cursor: "string", truncated: false, hasMore: false, nextPollMs: 1000 });
  say("a", "ann", "one");
  const { events: [polled] } = await poll(start.cursor);
  assert.deepEqual(Object.keys(polled), ["eventId", "name", "timestamp", "data"]);
  assert.equal((await poll("someone else's cursor")).truncated, true);

  const received: any[] = [];
  for (const kind of ["active", "event", "heartbeat"])
    client.setNotificationHandler(`notifications/events/${kind}`, { params: loose }, params => { received.push({ kind, ...params }); });
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

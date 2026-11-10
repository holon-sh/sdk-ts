import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { bindApps, createApps, type Binding } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { serve, serveLegacy } from "./helpers.ts";

function orders() {
  const server = new McpServer({ name: "orders", version: "1" });
  server.registerTool("get_order", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }) => ({ content: [], structuredContent: { id } }));
  return server;
}

const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
const identity = { name: "checkout", version: "1", requires: { orders: {}, payments: {} } };

function environment(t: TestContext, variables: Record<string, string>) {
  const saved = process.env;
  process.env = { ...saved, ...variables };
  t.after(() => { process.env = saved; });
}

// Records the requests that open and end sessions as the client sends them, optionally sending them elsewhere.
function record(t: TestContext, route: (url: string) => string = url => url) {
  const sent: string[] = [];
  const original = globalThis.fetch;
  t.mock.method(globalThis, "fetch", (input: string | URL | Request, init?: RequestInit) => {
    const method = typeof init?.body === "string" ? JSON.parse(init.body).method : init?.method;
    if (["server/discover", "initialize", "tools/call", "DELETE"].includes(method)) sent.push(method);
    return original(route(String(input)), init);
  });
  // Returns what was sent since the last look.
  return () => sent.splice(0);
}

test("a resolved binding keeps one session and reconnects after close, clients declare that they can be asked, and the environment fallback is scoped with the environment's bearer token", { timeout: 10000 }, async t => {
  environment(t, { PAYMENTS_MCP_URL: "" });
  const authorization = new Set();
  const { endpoint } = await serve(t, orders, req => authorization.add(req.headers.authorization));
  // Each new connection starts by discovering the server.
  const connections = { orders: 0, payments: 0 };
  const capabilities = { orders: new Set(), payments: new Set() };
  const originalFetch = globalThis.fetch;
  const counting = (app: keyof typeof connections): typeof fetch => async (input, init) => {
    if (typeof init?.body === "string") {
      const { method, params } = JSON.parse(init.body);
      if (method === "server/discover") connections[app] += 1;
      capabilities[app].add(JSON.stringify(params._meta[CLIENT_CAPABILITIES_META_KEY]));
    }
    return originalFetch(input, init);
  };
  // get_order has no output schema, so the tool returns its complete result.
  const resolved = createApps(identity, { orders: contract }, undefined, { resolve: app => app === "orders" ? { endpoint, fetch: counting("orders") } : undefined });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "a" }) as CompleteResult<unknown>).structuredContent, { id: "a" });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "b" }) as CompleteResult<unknown>).structuredContent, { id: "b" });
  assert.equal(connections.orders, 1);
  assert.deepEqual([...capabilities.orders], ['{"elicitation":{"form":{},"url":{}}}']);
  await resolved.orders.close();
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "c" }) as CompleteResult<unknown>).structuredContent, { id: "c" });
  assert.equal(connections.orders, 2);
  await resolved.orders.close();
  const apps = createApps(identity, { orders: contract });
  process.env.PAYMENTS_MCP_URL = endpoint;
  // The Node environment fallback is scoped and consulted on every call.
  t.mock.method(globalThis, "fetch", counting("payments"));
  // payments has no contract: an untyped client that calls any tool without validation. PAYMENTS_MCP_TOKEN is read on every call too and sent as the bearer token.
  for (const [id, token, header] of [["d", "", undefined], ["e", "secret", "Bearer secret"]]) {
    process.env.PAYMENTS_MCP_TOKEN = token;
    authorization.clear();
    assert.deepEqual((await apps.payments.callTool({ name: "get_order", arguments: { id } })).structuredContent, { id });
    assert.deepEqual([...authorization], [header]);
  }
  assert.equal(connections.payments, 2);
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

test("closing ends a 2025-era server's session, and a 2026-07-28 server has none to end", { timeout: 10000 }, async t => {
  const legacy = await serveLegacy(t, orders);
  const sent = record(t);
  const bind = (binding: Binding) => bindApps(identity, { orders: contract }, { orders: binding }).orders;
  assert.deepEqual((await bind({ endpoint: legacy.endpoint, scoped: true }).tools.get_order({ id: "a" }) as CompleteResult<unknown>).structuredContent, { id: "a" });
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE"]);
  assert.equal(legacy.sessions.size, 0);

  const persistent = bind({ endpoint: legacy.endpoint });
  await persistent.tools.get_order({ id: "b" });
  await persistent.tools.get_order({ id: "c" });
  assert.equal(legacy.sessions.size, 1);
  await persistent.close();
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "tools/call", "DELETE"]);
  assert.equal(legacy.sessions.size, 0);

  const modern = await serve(t, orders);
  await bind({ endpoint: modern.endpoint, scoped: true }).tools.get_order({ id: "d" });
  assert.deepEqual(sent(), ["server/discover", "tools/call"]);
});

test("environment-bound calls skip the probe of a 2025-era server until the verdict expires", { timeout: 10000 }, async t => {
  const legacy = await serveLegacy(t, orders);
  environment(t, { ORDERS_MCP_URL: legacy.endpoint });
  const sent = record(t);
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const app = createApps(identity, { orders: contract }).orders;
  for (const id of ["a", "b"]) assert.deepEqual((await app.callTool({ name: "get_order", arguments: { id } }) as CompleteResult<unknown>).structuredContent, { id });
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE", "initialize", "tools/call", "DELETE"]);
  // A server may have upgraded since, so ten minutes on the next call probes it again.
  t.mock.timers.tick(10 * 60 * 1000);
  await app.callTool({ name: "get_order", arguments: { id: "c" } });
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE"]);
  assert.equal(legacy.sessions.size, 0);
});

test("an environment-bound call reconnects when a 2025-era server becomes 2026-07-28 only", { timeout: 10000 }, async t => {
  const legacy = await serveLegacy(t, orders);
  const modern = await serve(t, orders);
  environment(t, { ORDERS_MCP_URL: legacy.endpoint });
  let upgraded = false;
  const sent = record(t, url => upgraded && url === legacy.endpoint ? modern.endpoint : url);
  const app = createApps(identity, { orders: contract }).orders;
  await app.callTool({ name: "get_order", arguments: { id: "a" } });
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE"]);
  upgraded = true;
  // The cached legacy verdict's initialize is refused, so the call probes again and adopts the new protocol.
  assert.deepEqual((await app.callTool({ name: "get_order", arguments: { id: "b" } }) as CompleteResult<unknown>).structuredContent, { id: "b" });
  assert.deepEqual(sent(), ["initialize", "server/discover", "tools/call"]);
  await app.callTool({ name: "get_order", arguments: { id: "c" } });
  assert.deepEqual(sent(), ["tools/call"]);
});

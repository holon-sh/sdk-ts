import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
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

function record(t: TestContext, route: (url: string) => string = url => url) {
  const sent: string[] = [];
  const original = globalThis.fetch;
  t.mock.method(globalThis, "fetch", (input: string | URL | Request, init?: RequestInit) => {
    const method = typeof init?.body === "string" ? JSON.parse(init.body).method : init?.method;
    if (["server/discover", "initialize", "tools/call", "DELETE"].includes(method)) sent.push(method);
    return original(route(String(input)), init);
  });
  return () => sent.splice(0);
}

test("a resolved binding keeps one session and reconnects after close, clients declare on every request that they can be asked and take files, and the environment fallback is scoped with the environment's bearer token", { timeout: 10000 }, async t => {
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
  assert.deepEqual([...capabilities.orders], ['{"elicitation":{"form":{},"url":{}},"extensions":{"io.modelcontextprotocol/files":{"upload":{},"download":{}}}}']);
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

test("environment-bound calls end 2025-era sessions and reuse the legacy verdict until it expires or the server upgrades", { timeout: 10000 }, async t => {
  const legacy = await serveLegacy(t, orders);
  const modern = await serve(t, orders);
  environment(t, { ORDERS_MCP_URL: legacy.endpoint });
  let upgraded = false;
  const sent = record(t, url => upgraded && url === legacy.endpoint ? modern.endpoint : url);
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const { orders: app } = createApps(identity, { orders: contract });
  const call = () => app.callTool({ name: "get_order", arguments: { id: "a" } });
  await call();
  await call();
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE", "initialize", "tools/call", "DELETE"]);
  t.mock.timers.tick(10 * 60 * 1000);
  await call();
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE"]);
  upgraded = true;
  await call();
  assert.deepEqual(sent(), ["initialize", "server/discover", "tools/call"]);
});

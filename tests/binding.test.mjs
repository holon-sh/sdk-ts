import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { serve } from "./helpers.mjs";

function orders() {
  const server = new McpServer({ name: "orders", version: "1" });
  server.registerTool("get_order", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }) => ({ content: [], structuredContent: { id } }));
  return server;
}

const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
const identity = { name: "checkout", version: "1", requires: { orders: {}, payments: {} } };

test("a resolved binding keeps one session and reconnects after close, clients declare that they can be asked, and the environment fallback is scoped with the environment's bearer token", { timeout: 10000 }, async t => {
  const environment = process.env;
  process.env = { ...environment, PAYMENTS_MCP_URL: "" };
  t.after(() => { process.env = environment; });
  const authorization = new Set();
  const { endpoint } = await serve(t, orders, req => authorization.add(req.headers.authorization));
  // A new connection starts by discovering the server.
  const connections = { orders: 0, payments: 0 };
  const capabilities = { orders: new Set(), payments: new Set() };
  const originalFetch = globalThis.fetch;
  const counting = app => async (input, init) => {
    if (typeof init?.body === "string") {
      const { method, params } = JSON.parse(init.body);
      if (method === "server/discover") connections[app] += 1;
      capabilities[app].add(JSON.stringify(params._meta[CLIENT_CAPABILITIES_META_KEY]));
    }
    return originalFetch(input, init);
  };
  const resolved = createApps(identity, { orders: contract }, undefined, { resolve: app => app === "orders" ? { endpoint, fetch: counting("orders") } : undefined });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "a" })).structuredContent, { id: "a" });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "b" })).structuredContent, { id: "b" });
  assert.equal(connections.orders, 1);
  assert.deepEqual([...capabilities.orders], ['{"elicitation":{"form":{},"url":{}}}']);
  await resolved.orders.close();
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "c" })).structuredContent, { id: "c" });
  assert.equal(connections.orders, 2);
  await resolved.orders.close();
  const apps = createApps(identity, { orders: contract });
  process.env.PAYMENTS_MCP_URL = endpoint;
  // The Node environment fallback is scoped and consulted on every call.
  t.mock.method(globalThis, "fetch", counting("payments"));
  // payments has no contract: an untyped client that calls any tool without validation. PAYMENTS_MCP_TOKEN is read on every call too and sent as the bearer token.
  // A new token discovers the server again; the same token reuses what it discovered.
  for (const [id, token, header] of [["d", "", undefined], ["e", "secret", "Bearer secret"], ["f", "secret", "Bearer secret"]]) {
    process.env.PAYMENTS_MCP_TOKEN = token;
    authorization.clear();
    assert.deepEqual((await apps.payments.callTool({ name: "get_order", arguments: { id } })).structuredContent, { id });
    assert.deepEqual([...authorization], [header]);
  }
  assert.equal(connections.payments, 2);
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

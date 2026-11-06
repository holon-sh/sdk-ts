import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, setDefaultBinding } from "holon-sh/runtime";
import { serve } from "./helpers.mjs";

function orders() {
  const server = new McpServer({ name: "orders", version: "1" });
  server.registerTool("get_order", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }) => ({ content: [], structuredContent: { id } }));
  return server;
}

const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
const identity = { name: "checkout", version: "1", requires: { orders: {}, payments: {} } };

test("Node bindings resolve lazily, prefer the resolver, declare that they can be asked, and fall back to scoped environment calls", { timeout: 10000 }, async t => {
  const environment = process.env;
  process.env = { ...environment, ORDERS_MCP_URL: "", PAYMENTS_MCP_URL: "" };
  t.after(() => { process.env = environment; setDefaultBinding(() => undefined); });
  setDefaultBinding(() => undefined);
  const apps = createApps(identity, { orders: contract });
  assert.throws(() => setDefaultBinding("not a function"), TypeError);
  const { endpoint } = await serve(t, orders);
  // Each new connection starts by discovering the server.
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
  process.env.ORDERS_MCP_URL = "http://unavailable.invalid/mcp";
  // Clients created before the resolver was set use it at call time.
  setDefaultBinding(() => ({ endpoint, fetch: counting("orders") }));
  assert.deepEqual((await apps.orders.tools.get_order({ id: "a" })).structuredContent, { id: "a" });
  assert.deepEqual((await apps.orders.tools.get_order({ id: "b" })).structuredContent, { id: "b" });
  assert.equal(connections.orders, 1);
  assert.deepEqual([...capabilities.orders], ['{"elicitation":{"form":{},"url":{}}}']);
  await apps.orders.close();

  // Existing hosts can also replace the shared symbol directly.
  setDefaultBinding(() => undefined);
  globalThis[Symbol.for("@holon-sh/sdk/default-binding")] = app => app === "orders" ? { endpoint } : undefined;
  assert.deepEqual((await apps.orders.tools.get_order({ id: "host" })).structuredContent, { id: "host" });
  await apps.orders.close();
  process.env.PAYMENTS_MCP_URL = endpoint;
  // The Node environment fallback is scoped and consulted on every call.
  t.mock.method(globalThis, "fetch", counting("payments"));
  // payments has no contract: an untyped client that calls any tool without validation.
  for (const id of ["c", "d"]) assert.deepEqual((await apps.payments.callTool({ name: "get_order", arguments: { id } })).structuredContent, { id });
  assert.equal(connections.payments, 2);
  assert.deepEqual([...capabilities.payments], ['{"elicitation":{"form":{},"url":{}}}']);
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

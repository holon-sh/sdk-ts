import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "@modelcontextprotocol/server";
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

test("Node bindings resolve lazily, prefer the resolver, and fall back to scoped environment calls", { timeout: 10000 }, async t => {
  const environment = process.env;
  process.env = { ...environment, ORDERS_MCP_URL: "", PAYMENTS_MCP_URL: "" };
  t.after(() => { process.env = environment; setDefaultBinding(() => undefined); });
  setDefaultBinding(() => undefined);
  const apps = createApps(identity, { orders: contract });
  await assert.rejects(apps.orders.tools.get_order({ id: "a" }), /Dependency orders is unavailable \(ORDERS_MCP_URL\)\. Provide a binding or set the environment variable\./);
  assert.throws(() => setDefaultBinding("not a function"), TypeError);
  await assert.rejects(createApps({ name: "checkout", version: "1" }, { orders: contract }).orders.tools.get_order({ id: "a" }), /Dependency orders is not declared/);
  const { endpoint } = await serve(t, orders);
  // Each new connection starts by discovering the server.
  const connections = { orders: 0, payments: 0 };
  const originalFetch = globalThis.fetch;
  const counting = app => async (input, init) => {
    if (typeof init?.body === "string" && JSON.parse(init.body).method === "server/discover") connections[app] += 1;
    return originalFetch(input, init);
  };
  process.env.ORDERS_MCP_URL = "http://unavailable.invalid/mcp";
  // Clients created before the resolver was set use it at call time.
  setDefaultBinding(() => ({ endpoint, fetch: counting("orders") }));
  assert.deepEqual((await apps.orders.tools.get_order({ id: "a" })).structuredContent, { id: "a" });
  assert.deepEqual((await apps.orders.tools.get_order({ id: "b" })).structuredContent, { id: "b" });
  assert.equal(connections.orders, 1);
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
  assert.deepEqual(Object.keys(apps.payments.tools), []);
  assert.deepEqual(Object.keys(apps.payments.resources), []);
  for (const id of ["c", "d"]) {
    const result = await apps.payments.callTool({ name: "get_order", arguments: { id } });
    assert.equal(result.resultType, "complete");
    assert.deepEqual(result.structuredContent, { id });
  }
  assert.equal(connections.payments, 2);
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

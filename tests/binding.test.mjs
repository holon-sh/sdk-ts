import { afterEach, test } from "node:test";
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

afterEach(() => setDefaultBinding(() => undefined));

const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
const identity = { name: "checkout", version: "1", requires: { orders: {}, payments: {} } };

test("an app without a resolver or environment variable is unavailable", async () => {
  delete process.env.ORDERS_MCP_URL;
  setDefaultBinding(() => undefined);
  const apps = createApps(identity, { orders: contract });
  await assert.rejects(apps.orders.tools.get_order({ id: "a" }), /Dependency orders is unavailable \(ORDERS_MCP_URL\)\. Provide a binding or set the environment variable\./);
  assert.throws(() => setDefaultBinding("not a function"), TypeError);
  const undeclared = createApps({name: "checkout", version: "1"}, {orders: contract});
  await assert.rejects(undeclared.orders.tools.get_order({id: "a"}), /Dependency orders is not declared/);
});

test("the default binding supplies the endpoint and fetch, and scoped bindings reconnect per call", { timeout: 10000 }, async t => {
  const { endpoint } = await serve(t, orders);
  // Each new connection starts by discovering the server.
  const connections = { orders: 0, payments: 0 };
  const counting = app => async (input, init) => {
    if (typeof init?.body === "string" && JSON.parse(init.body).method === "server/discover") connections[app] += 1;
    return fetch(input, init);
  };
  // Created before the resolver is set: bindings resolve per call, not when the package is imported.
  const apps = createApps(identity, { orders: contract });
  setDefaultBinding(app => app === "orders" ? { endpoint, fetch: counting("orders") } : { endpoint, fetch: counting("payments"), scoped: true });
  assert.deepEqual(await apps.orders.tools.get_order({ id: "a" }), { id: "a" });
  assert.deepEqual(await apps.orders.tools.get_order({ id: "b" }), { id: "b" });
  assert.equal(connections.orders, 1);
  await apps.orders.close();

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

test("existing hosts set the established binding symbol directly", async t => {
  const { endpoint } = await serve(t, orders);
  const hosted = createApps(identity, {orders: contract});
  globalThis[Symbol.for("@holon-sh/sdk/default-binding")] = () => ({endpoint});
  assert.deepEqual(await hosted.orders.tools.get_order({id:"host"}), {id:"host"});
  await hosted.orders.close();
});

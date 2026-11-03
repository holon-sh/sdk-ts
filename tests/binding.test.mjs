import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_CAPABILITIES_META_KEY, acceptedContent, inputRequired } from "@modelcontextprotocol/server";
import { z } from "zod";
import { bindApps, createApps, setDefaultBinding, ToolCallError } from "holon-sh/runtime";
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

test("endpoint bindings declare client capabilities on every request and continue input-required calls", { timeout: 10000 }, async t => {
  const confirmation = z.object({ confirmation: z.string() });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "cloud", version: "1" });
    server.registerTool("delete_account", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }, ctx) => {
      // Servers MUST NOT request input the client did not declare: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
      if (!ctx.mcpReq.envelope[CLIENT_CAPABILITIES_META_KEY].elicitation) return { isError: true, content: [{ type: "text", text: "Confirmation unavailable" }] };
      if (acceptedContent(ctx.mcpReq.inputResponses, "confirm")?.confirmation !== "DELETE") {
        return inputRequired({ inputRequests: { confirm: inputRequired.elicit({ message: `Type DELETE to delete ${id}.`, requestedSchema: confirmation }) }, requestState: id });
      }
      return { content: [], structuredContent: { deleted: ctx.mcpReq.requestState() } };
    });
    return server;
  });
  const contract = { tools: [{ name: "delete_account", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
  const bind = binding => {
    const declared = [];
    const recording = async (input, init) => {
      if (typeof init?.body === "string") declared.push(JSON.parse(init.body).params._meta[CLIENT_CAPABILITIES_META_KEY]);
      return fetch(input, init);
    };
    const { cloud } = bindApps({ name: "console", version: "1" }, { cloud: contract }, { cloud: { endpoint, fetch: recording, ...binding } });
    t.after(() => cloud.close());
    return { cloud, declared };
  };

  const form = { elicitation: { form: {} } };
  const gated = bind({ capabilities: form });
  const thrown = await gated.cloud.tools.delete_account({ id: "acct" }).catch(error => error);
  assert.ok(thrown instanceof ToolCallError);
  assert.equal(thrown.code, "input_required");
  const { inputRequests, requestState } = thrown.result;
  assert.equal(inputRequests.confirm.method, "elicitation/create");
  assert.equal(inputRequests.confirm.params.mode, "form");
  const continued = await gated.cloud.callTool({ name: "delete_account", arguments: { id: "acct" }, inputResponses: { confirm: { action: "accept", content: { confirmation: "DELETE" } } }, requestState });
  assert.deepEqual(continued.structuredContent, { deleted: "acct" });
  // server/discover and both tools/call requests.
  assert.deepEqual(gated.declared, [form, form, form]);

  const plain = bind({});
  const refused = await plain.cloud.callTool({ name: "delete_account", arguments: { id: "acct" } });
  assert.equal(refused.isError, true);
  assert.deepEqual(plain.declared, [{}, {}]);
});

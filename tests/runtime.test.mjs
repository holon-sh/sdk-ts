import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_INFO_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, ToolCallError } from "holon-sh/runtime";
import { serve } from "./helpers.mjs";

test("tools return output or throw while callTool preserves MCP results and identity", {timeout: 10000}, async t => {
  const input = z.strictObject({ id: z.string(), limit: z.number().default(5) });
  const output = z.object({ total: z.number() });
  const identities = [];
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("get_order", { inputSchema: input }, async (args, ctx) => {
      identities.push(ctx.mcpReq.envelope[CLIENT_INFO_META_KEY].name);
      if (args.id === "error") return { isError: true, content: [{ type: "text", text: "Unavailable" }], structuredContent: "failure", _meta: { preserved: true } };
      if (args.id === "input") return { resultType: "input_required", requestState: "opaque-state" };
      if (args.id === "text") return { content: [{ type: "text", text: '{"total":5}' }] };
      return { content: [{ type: "text", text: "Order" }], structuredContent: { total: args.id === "bad" ? "invalid" : args.limit }, _meta: { preserved: true } };
    });
    return server;
  });
  const previous = process.env.ORDERS_MCP_URL;
  process.env.ORDERS_MCP_URL = endpoint;
  t.after(() => {
    if (previous === undefined) delete process.env.ORDERS_MCP_URL; else process.env.ORDERS_MCP_URL = previous;
  });
  const contract = { tools: [{ name: "get_order", inputSchema: z.toJSONSchema(input, { io: "input" }), outputSchema: z.toJSONSchema(output) }] };
  const make = name => createApps({ name, version: "1", requires: { orders: {} } }, { orders: contract });
  const first = make("first");
  const second = make("second");
  const arguments_ = { id: "valid" };
  const results = await Promise.all([first.orders.tools.get_order(arguments_), second.orders.callTool({ name: "get_order", arguments: { id: "valid", limit: 2 } })]);
  assert.deepEqual(results[0], { total: 5 });
  assert.equal(results[1].resultType, "complete");
  assert.notEqual(results[1].isError, true, JSON.stringify(results[1]));
  assert.deepEqual(results[1].structuredContent, { total: 2 });
  assert.deepEqual(results[1].content, [{ type: "text", text: "Order" }]);
  assert.equal(results[1]._meta.preserved, true);
  assert.deepEqual(arguments_, { id: "valid" });
  assert.deepEqual(identities.sort(), ["first", "second"]);
  const extra = { id: "valid", extra: true };
  await assert.rejects(first.orders.tools.get_order(extra), /Invalid arguments/);
  const error = await first.orders.callTool({ name: "get_order", arguments: { id: "error" } });
  assert.equal(error.isError, true);
  assert.equal(error.structuredContent, "failure");
  assert.equal(error._meta.preserved, true);
  const incomplete = await first.orders.callTool({ name: "get_order", arguments: { id: "input" } });
  assert.equal(incomplete.resultType, "input_required");
  assert.equal(incomplete.requestState, "opaque-state");
  const dynamic = createApps({ name: "dynamic", version: "1", requires: { orders: {} } }, {});
  for (const [id, code, result] of [["error", "tool_error", error], ["input", "input_required", incomplete]]) {
    assert.deepEqual(await dynamic.orders.callTool({ name: "get_order", arguments: { id } }), result);
    await assert.rejects(first.orders.tools.get_order({ id }), thrown => {
      assert.ok(thrown instanceof ToolCallError);
      assert.equal(thrown.code, code);
      assert.equal(thrown.app, "orders");
      assert.equal(thrown.tool, "get_order");
      assert.match(thrown.message, /orders\.get_order/);
      assert.deepEqual(thrown.result, result);
      return true;
    });
  }
  await assert.rejects(first.orders.callTool({ name: "absent", arguments: {} }), /Unknown tool orders\.absent/);
  await assert.rejects(first.orders.callTool({ name: "get_order", arguments: { id: "bad" } }), /Invalid structured output/);
  await assert.rejects(first.orders.tools.get_order({ id: "text" }), /Invalid structured output/);
  const untyped = createApps({ name: "untyped", version: "1", requires: { orders: {} } }, { orders: { tools: [{ name: "get_order", inputSchema: contract.tools[0].inputSchema }] } });
  assert.deepEqual(await untyped.orders.tools.get_order({ id: "bad" }), { total: "invalid" });
  assert.equal(await untyped.orders.tools.get_order({ id: "text" }), undefined);
});

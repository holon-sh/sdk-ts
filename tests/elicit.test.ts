import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { acceptedContent, inputRequired, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, ToolCallError } from "holon-sh/runtime";
import { serve } from "./helpers.ts";

const input = z.object({ id: z.string() });
const output = z.object({ shipped: z.string() });
const answer = z.object({ size: z.string() });
const contract = { tools: [{ name: "ship", inputSchema: z.toJSONSchema(input), outputSchema: z.toJSONSchema(output) }] };
const question = "Which size should I ship?";

// Asks until it has a size, treats the size "again" as no answer at all, and rejects a retry that lost its state.
async function orders(t: TestContext) {
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("ship", { inputSchema: input }, async ({ id }, ctx) => {
      if (id === "connect") return inputRequired({ inputRequests: { link: inputRequired.elicitUrl({ message: "Connect your account.", url: "https://orders.example/connect" }) } });
      const responses = ctx.mcpReq.inputResponses;
      if (responses?.size && ctx.mcpReq.requestState() !== "opaque") return { isError: true, content: [{ type: "text", text: "Lost the request state" }] };
      const accepted = responses?.size ? acceptedContent(responses, "size", answer) : undefined;
      if (!responses?.size || accepted?.size === "again") return inputRequired({ inputRequests: { size: inputRequired.elicit({ message: question, requestedSchema: answer }) }, requestState: "opaque" });
      if (!accepted) return { isError: true, content: [{ type: "text", text: "Nothing shipped" }] };
      return { content: [], structuredContent: { shipped: accepted.size } };
    });
    return server;
  });
  const { orders: app } = createApps({ name: "checkout", version: "1", requires: {} }, { orders: contract }, { orders: { endpoint } });
  t.after(() => app.close());
  return app;
}

test("a declined question reaches the tool", { timeout: 10000 }, async t => {
  const app = await orders(t);
  await assert.rejects(app.tools.ship({ id: "A-1" }, { elicit: () => ({ action: "decline" }) }), thrown => thrown instanceof ToolCallError && /Nothing shipped/.test(thrown.message));
});

test("answering a server that keeps asking stops, and the question reaches the caller", { timeout: 10000 }, async t => {
  const app = await orders(t);
  await assert.rejects(app.tools.ship({ id: "A-1" }, { elicit: () => ({ action: "accept", content: { size: "again" } }) }), thrown => thrown instanceof ToolCallError && thrown.result.resultType === "input_required" && thrown.message.includes(question));
});

test("a caller can answer a question through callTool", { timeout: 10000 }, async t => {
  const app = await orders(t);
  const request = { name: "ship", arguments: { id: "A-1" } };
  const result = await app.callTool(request);
  assert.equal(result.resultType, "input_required");
  const continued = await app.callTool({ ...request, requestState: result.requestState, inputResponses: { size: { action: "accept", content: { size: "small" } } } });
  assert.deepEqual(continued.structuredContent, { shipped: "small" });
});

test("a URL question is declared for, and names its URL when it reaches the caller", { timeout: 10000 }, async t => {
  const app = await orders(t);
  await assert.rejects(app.tools.ship({ id: "connect" }), thrown => thrown instanceof ToolCallError && thrown.message.includes("Connect your account.") && thrown.message.includes("https://orders.example/connect"));
  const seen: unknown[] = [];
  await assert.rejects(app.tools.ship({ id: "connect" }, { elicit: params => { seen.push(params.mode); return { action: "decline" }; } }), ToolCallError);
  assert.ok(seen.length > 0 && seen.every(mode => mode === "url"));
});

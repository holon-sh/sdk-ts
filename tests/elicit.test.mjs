import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptedContent, inputRequired, McpServer, MissingRequiredClientCapabilityError } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, ToolCallError } from "holon-sh/runtime";
import { serve } from "./helpers.mjs";

const input = z.object({ id: z.string() });
const output = z.object({ shipped: z.string() });
const answer = z.object({ size: z.string() });
const contract = { tools: [{ name: "ship", inputSchema: z.toJSONSchema(input), outputSchema: z.toJSONSchema(output) }] };
const question = "Which size should I ship?";

function orders(t) {
  return serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("ship", { inputSchema: input }, async (_args, ctx) => {
      const responses = ctx.mcpReq.inputResponses;
      if (!responses?.size) return inputRequired({ inputRequests: { size: inputRequired.elicit({ message: question, requestedSchema: answer }) } });
      const accepted = acceptedContent(responses, "size", answer);
      if (!accepted) return { isError: true, content: [{ type: "text", text: "Nothing shipped" }] };
      return { content: [], structuredContent: accepted.size === "invalid" ? { shipped: 1 } : { shipped: accepted.size } };
    });
    return server;
  });
}

async function client(t, binding) {
  const { endpoint } = await orders(t);
  const { orders: app } = createApps({ name: "checkout", version: "1", requires: {} }, { orders: contract }, { orders: { endpoint, ...binding } });
  t.after(() => app.close());
  return app;
}

test("elicit answers the question in place and the tool returns its typed output", { timeout: 10000 }, async t => {
  const asked = [];
  const app = await client(t, { elicit: async ({ params }) => {
    asked.push(params.message);
    return { action: "accept", content: { size: "large" } };
  } });
  assert.deepEqual(await app.tools.ship({ id: "A-1" }), { shipped: "large" });
  assert.deepEqual(asked, [question]);
  const whole = await app.callTool({ name: "ship", arguments: { id: "A-1" } });
  assert.equal(whole.resultType, "complete");
  assert.deepEqual(whole.structuredContent, { shipped: "large" });
});

test("a declined elicitation reaches the tool", { timeout: 10000 }, async t => {
  const app = await client(t, { elicit: () => ({ action: "decline" }) });
  await assert.rejects(app.tools.ship({ id: "A-1" }), thrown => thrown instanceof ToolCallError && /Nothing shipped/.test(thrown.message));
});

test("accepted output is still validated", { timeout: 10000 }, async t => {
  const app = await client(t, { elicit: () => ({ action: "accept", content: { size: "invalid" } }) });
  await assert.rejects(app.tools.ship({ id: "A-1" }), /Invalid structured output/);
});

test("without elicit the caller reads the question from the error and continues through callTool", { timeout: 10000 }, async t => {
  const app = await client(t, { capabilities: { elicitation: { form: {} } } });
  const thrown = await app.tools.ship({ id: "A-1" }).catch(error => error);
  assert.ok(thrown instanceof ToolCallError);
  const { result } = thrown;
  assert.equal(result.inputRequests.size.params.message, question);
  const inputResponses = { size: { action: "accept", content: { size: "small" } } };
  const continued = await app.callTool({ name: "ship", arguments: { id: "A-1" }, requestState: result.requestState, inputResponses });
  assert.deepEqual(continued.structuredContent, { shipped: "small" });
});

test("a client without the capability is told how to declare it", { timeout: 10000 }, async t => {
  const app = await client(t, {});
  await assert.rejects(app.tools.ship({ id: "A-1" }), thrown => {
    assert.ok(thrown instanceof MissingRequiredClientCapabilityError);
    assert.match(thrown.message, /^orders\.ship: .*Set elicit or capabilities on the binding\.$/);
    return true;
  });
});

test("explicit capabilities replace the elicitation capability that elicit declares", { timeout: 10000 }, async t => {
  const app = await client(t, { capabilities: { elicitation: { url: {} } }, elicit: () => ({ action: "decline" }) });
  await assert.rejects(app.tools.ship({ id: "A-1" }), MissingRequiredClientCapabilityError);
});

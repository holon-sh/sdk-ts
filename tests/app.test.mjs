import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { createApp, tool, resource } from "../packages/node/app.js";

test("function apps expose native MCP schemas, calls, reads, and subscriptions", async (t) => {
  let value = 0,
    executions = 0;
  const shape = {
    type: "object",
    properties: { value: { type: "number" } },
    required: ["value"],
    additionalProperties: false,
  };
  const state = resource("counter://value", () => ({ value }));
  const add = tool(
    { changes: [state], annotations: { destructiveHint: false } },
    ({ value: delta }, context) => {
      assert.ok(context.mcpReq.signal instanceof AbortSignal);
      executions++;
      value += delta;
      return { value };
    },
  );
  const handler = createApp(
    { name: "counter", version: "1" },
    {
      tools: { add },
      resources: { state },
      contract: {
        tools: [{ name: "add", inputSchema: shape, outputSchema: shape }],
        resources: [{ uri: state.uri, outputSchema: shape }],
      },
    },
  );
  const client = new Client(
    { name: "native-client", version: "1" },
    { versionNegotiation: { mode: "auto" } },
  );
  t.after(async () => {
    await client.close();
    await handler.close();
  });
  await client.connect(
    new StreamableHTTPClientTransport(new URL("http://counter/mcp"), {
      fetch: (url, init) => handler.fetch(new Request(url, init)),
    }),
  );
  const catalog = await client.listTools();
  assert.deepEqual(catalog.tools[0].inputSchema, shape);
  assert.deepEqual(catalog.tools[0]._meta["sh.holon/changes"], [state.uri]);
  const updates = [];
  client.setNotificationHandler("notifications/resources/updated", (event) =>
    updates.push(event.params.uri),
  );
  const subscription = await client.listen({
    resourceSubscriptions: [state.uri],
  });
  t.after(() => subscription.close());
  const result = await client.callTool({
    name: "add",
    arguments: { value: 2 },
  });
  assert.deepEqual(result.structuredContent, { value: 2 });
  const snapshot = await client.readResource({ uri: state.uri });
  assert.deepEqual(JSON.parse(snapshot.contents[0].text), { value: 2 });
  assert.deepEqual(updates, [state.uri]);
  const invalid = await client.callTool({
    name: "add",
    arguments: { value: "invalid" },
  });
  assert.equal(invalid.isError, true);
  assert.equal(executions, 1);
});

test("a stale generated catalog fails before any callback executes", () => {
  assert.throws(
    () =>
      createApp(
        { name: "app", version: "1" },
        { tools: { missing: tool({}, () => ({})) }, contract: { tools: [] } },
      ),
    /Generated tools differ/,
  );
});

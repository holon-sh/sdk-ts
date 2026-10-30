import assert from "node:assert/strict";
import { test } from "node:test";
import { cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { install } from "./helpers.mjs";

test("register adds typed declarations to a native server", async (t) => {
  const { consumer, directory } = install(t);
  await assert.rejects(
    import(`${pathToFileURL(join(directory, "app.js"))}?placeholder`),
    /Run holon types generate for this app before starting its server\./,
  );
  // The contract `holon types generate` writes into the slot; generation is tested in holon-sh/cli.
  cpSync(new URL("./fixtures/counter/", import.meta.url), join(directory, "generated"), { recursive: true });
  // Resolve both packages from the app, so the server and holon-sh/app share one SDK.
  writeFileSync(
    join(consumer, "sdk.mjs"),
    'export * from "holon-sh/app";\nexport { McpServer, createMcpHandler } from "@modelcontextprotocol/server";\n',
  );
  const { McpServer, createMcpHandler, register, resource, tool } =
    await import(pathToFileURL(join(consumer, "sdk.mjs")));
  const shape = {
    type: "object",
    properties: { value: { type: "number" } },
    required: ["value"],
    additionalProperties: false,
  };
  let value = 0,
    executions = 0;
  const state = resource("counter://value", () => ({ value }));
  const ui = { ui: { resourceUri: "ui://counter/index.html" } };
  const show = tool({ _meta: ui }, () => ({ value }));
  const add = tool(
    { changes: [state], annotations: { destructiveHint: false } },
    ({ value: delta }, context) => {
      assert.ok(context.mcpReq.signal instanceof AbortSignal);
      executions++;
      value += delta;
      return { value };
    },
  );

  await t.test("a stale generated catalog fails before any callback executes", () => {
    assert.throws(
      () =>
        register(new McpServer({ name: "counter", version: "1" }), {
          tools: { missing: tool({}, () => ({})) },
        }),
      /Generated tools differ/,
    );
  });

  await t.test("native schemas, calls, reads, and subscriptions", async (t) => {
    const handler = createMcpHandler(() => {
      const server = new McpServer(
        { name: "counter", version: "1" },
        { capabilities: { resources: { subscribe: true } } },
      );
      register(server, { tools: { add, show }, resources: { state } }, (uri) =>
        handler.notify.resourceUpdated(uri),
      );
      return server;
    });
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
    const catalog = Object.fromEntries(
      (await client.listTools()).tools.map((entry) => [entry.name, entry]),
    );
    assert.deepEqual(catalog.add.inputSchema, shape);
    assert.deepEqual(catalog.add._meta["sh.holon/changes"], [state.uri]);
    assert.deepEqual(catalog.show._meta, ui);
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
});

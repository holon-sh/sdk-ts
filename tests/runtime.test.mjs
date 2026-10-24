import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { McpServer, createMcpHandler, CLIENT_INFO_META_KEY } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { createApps, bindApps, ToolCallError, exposeTools, registerPageTools } from "@holon/apps/runtime";

test("tools return output or throw while callTool preserves MCP results and identity", {timeout: 10000}, async t => {
  const input = z.strictObject({ id: z.string(), limit: z.number().default(5) });
  const output = z.object({ total: z.number() });
  const identities = [];
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("get_order", { inputSchema: input }, async (args, ctx) => {
      identities.push(ctx.mcpReq.envelope[CLIENT_INFO_META_KEY].name);
      if (args.id === "error") return { isError: true, content: [{ type: "text", text: "Unavailable" }], structuredContent: "failure", _meta: { preserved: true } };
      if (args.id === "input") return { resultType: "input_required", requestState: "opaque-state" };
      if (args.id === "text") return { content: [{ type: "text", text: '{"total":5}' }] };
      return { content: [{ type: "text", text: "Order" }], structuredContent: { total: args.id === "bad" ? "invalid" : args.limit }, _meta: { preserved: true } };
    });
    return server;
  }, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => void dispatch(req, res).catch(() => res.destroy()));
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const previous = process.env.ORDERS_MCP_URL;
  process.env.ORDERS_MCP_URL = `http://127.0.0.1:${http.address().port}/mcp`;
  t.after(async () => {
    if (previous === undefined) delete process.env.ORDERS_MCP_URL; else process.env.ORDERS_MCP_URL = previous;
    await handler.close();
    http.closeAllConnections();
    await new Promise(resolve => http.close(resolve));
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
  for (const [id, code, result] of [["error", "tool_error", error], ["input", "input_required", incomplete]]) {
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
  await assert.rejects(first.orders.callTool({ name: "get_order", arguments: { id: "bad" } }), /Invalid structured output/);
  await assert.rejects(first.orders.tools.get_order({ id: "text" }), /Invalid structured output/);
  const untyped = createApps({ name: "untyped", version: "1", requires: { orders: {} } }, { orders: { tools: [{ name: "get_order", inputSchema: contract.tools[0].inputSchema }] } });
  assert.deepEqual(await untyped.orders.tools.get_order({ id: "bad" }), { total: "invalid" });
  assert.equal(await untyped.orders.tools.get_order({ id: "text" }), undefined);
});

test("browser bindings call the app's own tools directly or through an MCP Apps host and expose them to WebMCP", { timeout: 10000 }, async t => {
  const input = z.strictObject({ id: z.string() });
  const output = z.object({ total: z.number() });
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "chat", version: "1" });
    server.registerTool("get_order", { description: "Read one order", inputSchema: input, annotations: { readOnlyHint: true } }, async ({ id }) =>
      ({ content: [{ type: "text", text: id }], structuredContent: { total: id.length } }));
    for (const [uri, total] of [["orders://summary", 3], ["orders://broken", "x"]]) {
      server.registerResource(uri, uri, { mimeType: "application/json" }, () => ({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ total }) }] }));
    }
    return server;
  }, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => void dispatch(req, res).catch(() => res.destroy()));
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  t.after(async () => {
    delete globalThis.document;
    await handler.close();
    http.closeAllConnections();
    await new Promise(resolve => http.close(resolve));
  });
  const summary = z.toJSONSchema(output);
  const contract = { tools: [{ name: "get_order", inputSchema: z.toJSONSchema(input, { io: "input" }), outputSchema: summary }], resources: [{ uri: "orders://summary", outputSchema: summary }, { uri: "orders://broken", outputSchema: summary }] };
  const identity = { name: "chat-web", version: "1", requires: {} };
  const endpoint = `http://127.0.0.1:${http.address().port}/mcp`;
  const direct = createApps(identity, { chat: contract }, { chat: { endpoint } });
  t.after(() => direct.chat.close());
  assert.deepEqual(await direct.chat.tools.get_order({ id: "abc" }), { total: 3 });
  assert.deepEqual(await direct.chat.resources["orders://summary"].read(), { total: 3 });
  await assert.rejects(direct.chat.resources["orders://broken"].read(), /Invalid contents/);
  assert.equal(await exposeTools(direct.chat), false);
  const registered = [];
  globalThis.document = { modelContext: { registerTool: async (tool, options) => { registered.push({ tool, options }); } } };
  const signal = new AbortController().signal;
  assert.equal(await exposeTools(direct.chat, { signal }), true);
  assert.deepEqual(registered.map(({ tool, options }) => [tool.name, tool.description, tool.annotations.readOnlyHint, options.signal]), [["get_order", "Read one order", true, signal]]);
  const executed = await registered[0].tool.execute({ id: "abcd" });
  assert.equal(executed.resultType, "complete");
  assert.deepEqual(executed.structuredContent, { total: 4 });
  const custom = [];
  await exposeTools(direct.chat, { execute: async (name, args) => { custom.push([name, args]); return "custom"; } });
  assert.equal(await registered[1].tool.execute({ id: "z" }), "custom");
  assert.deepEqual(custom, [["get_order", { id: "z" }]]);

  const calls = [];
  const host = {
    callServerTool: async (params, options) => { calls.push([params, options?.signal]); return params.arguments.id === "bad" ? { content: [], structuredContent: { total: "no" } } : { content: [{ type: "text", text: "hosted" }], structuredContent: { total: 9 } }; },
    readServerResource: async ({ uri }) => ({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ total: 1 }) }] }),
  };
  const hosted = createApps(identity, { chat: contract }, { chat: { host } });
  assert.deepEqual(await hosted.chat.tools.get_order({ id: "x" }, { signal }), { total: 9 });
  assert.deepEqual(await hosted.chat.resources["orders://summary"].read(), { total: 1 });
  assert.deepEqual(calls, [[{ name: "get_order", arguments: { id: "x" } }, signal]]);
  await assert.rejects(hosted.chat.tools.get_order({ id: 1 }), /Invalid arguments/);
  await assert.rejects(exposeTools(hosted.chat), /bound to its host/);
  await hosted.chat.close();
});

test("endpoint bindings carry the auth provider and watch resources through subscriptions", { timeout: 20000 }, async t => {
  const summary = z.object({ total: z.number() });
  const uri = "orders://summary";
  let total = 1;
  const authorizations = [];
  const serve = subscribe => {
    const handler = createMcpHandler(() => {
      const server = new McpServer({ name: "orders", version: "1" }, subscribe ? { capabilities: { resources: { subscribe: true } } } : {});
      server.registerResource("summary", uri, { mimeType: "application/json" }, () => ({ ttlMs: 0, cacheScope: "private", contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ total }) }] }));
      return server;
    }, { legacy: "reject" });
    const dispatch = toNodeHandler(handler);
    const http = createServer((req, res) => { authorizations.push(req.headers.authorization); void dispatch(req, res).catch(() => res.destroy()); });
    http.listen(0, "127.0.0.1");
    t.after(async () => { await handler.close(); http.closeAllConnections(); await new Promise(resolve => http.close(resolve)); });
    return { handler, http, ready: once(http, "listening").then(() => `http://127.0.0.1:${http.address().port}/mcp`) };
  };
  const live = serve(true);
  const plain = serve(false);
  const [endpoint, plainEndpoint] = await Promise.all([live.ready, plain.ready]);
  const contract = { tools: [], resources: [{ uri, outputSchema: z.toJSONSchema(summary) }] };
  const identity = { name: "script", version: "1", requires: {} };
  assert.throws(() => bindApps(identity, { orders: contract }, { missing: { endpoint } }), /Unknown app binding/);
  const bound = bindApps(identity, { orders: contract }, { orders: { endpoint, authProvider: { token: async () => "external" } } });
  t.after(() => bound.orders.close());
  assert.deepEqual(await bound.orders.resources[uri].read(), { total: 1 });
  assert.ok(authorizations.length > 0 && authorizations.every(value => value === "Bearer external"), JSON.stringify(authorizations));

  const seen = [];
  const arrivals = [];
  const next = () => new Promise(resolve => arrivals.push(resolve));
  const controller = new AbortController();
  const first = next();
  const watching = bound.orders.resources[uri].watch(value => { seen.push(value); arrivals.shift()?.(); }, { signal: controller.signal });
  await first;
  const second = next();
  total = 2;
  live.handler.notify.resourceUpdated(uri);
  await second;
  assert.deepEqual(seen, [{ total: 1 }, { total: 2 }]);
  controller.abort();
  await watching;

  await assert.rejects(createApps({ ...identity, requires: { orders: {} } }, { orders: contract }).orders.resources[uri].watch(() => {}), /endpoint binding/);
  const hosted = createApps(identity, { orders: contract }, { orders: { host: { callServerTool: async () => ({}), readServerResource: async () => ({ contents: [{ text: '{"total":3}' }] }) } } });
  await assert.rejects(hosted.orders.resources[uri].watch(() => {}), /endpoint binding/);
  await assert.rejects(bindApps(identity, { orders: contract }, { orders: { endpoint: plainEndpoint } }).orders.resources[uri].watch(() => {}), /does not advertise resource subscriptions/);
});

test("page tools register with the MCP Apps host when embedded and with WebMCP when standalone", async t => {
  t.after(() => { delete globalThis.document; });
  const schema = z.object({ x: z.number().min(0).max(1) });
  const calls = [];
  const tools = { move: { description: "Move", inputSchema: schema, annotations: { readOnlyHint: false }, execute: ({ x }) => { calls.push(x); return { content: [{ type: "text", text: String(x) }] }; } } };
  const hosted = [];
  let removed = 0;
  const view = { registerTool: (name, config, callback) => { hosted.push({ name, config, callback }); return { remove: () => { removed += 1; } }; } };
  const controller = new AbortController();
  assert.equal(await registerPageTools(tools, { view, signal: controller.signal }), true);
  assert.equal(hosted.length, 1);
  assert.equal(hosted[0].config.inputSchema, schema);
  assert.deepEqual(hosted[0].callback({ x: 0.5 }), { content: [{ type: "text", text: "0.5" }] });
  controller.abort();
  assert.equal(removed, 1);

  assert.equal(await registerPageTools(tools), false);
  const registered = [];
  globalThis.document = { modelContext: { registerTool: async (tool, options) => { registered.push({ tool, options }); } } };
  const signal = new AbortController().signal;
  assert.equal(await registerPageTools(tools, { signal }), true);
  assert.equal(registered[0].options.signal, signal);
  assert.deepEqual([registered[0].tool.name, registered[0].tool.description, registered[0].tool.inputSchema.properties.x.maximum], ["move", "Move", 1]);
  assert.deepEqual(await registered[0].tool.execute({ x: 1 }), { content: [{ type: "text", text: "1" }] });
  await assert.rejects(registered[0].tool.execute({ x: 2 }), /Invalid arguments for move/);
  assert.deepEqual(calls, [0.5, 1]);
});

test("createApps validates with the caller's validator when one is given", async () => {
  const schemas = [];
  const validator = schema => { schemas.push(schema); return Object.assign(() => false, { errors: ["rejected"] }); };
  const contracts = { orders: { tools: [{ name: "get", inputSchema: { type: "object" } }] } };
  const host = { callServerTool: () => assert.fail("invalid arguments reached the host"), readServerResource: () => assert.fail("unexpected read") };
  const apps = bindApps({ name: "checkout", version: "1", requires: {} }, contracts, { orders: { host } }, { validator });
  await assert.rejects(apps.orders.tools.get({}), /Invalid arguments for orders\.get: \["rejected"\]/);
  assert.deepEqual(schemas, [{ type: "object" }]);
});

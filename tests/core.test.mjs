import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer, CLIENT_INFO_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, bindApps, ToolCallError } from "holon-core";
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
  // No explicit bindings: the resolve hook binds every declared dependency, one connection per call.
  const resolve = name => name === "orders" ? { endpoint, scoped: true } : undefined;
  const contract = { tools: [{ name: "get_order", inputSchema: z.toJSONSchema(input, { io: "input" }), outputSchema: z.toJSONSchema(output) }] };
  const make = name => createApps({ name, version: "1", requires: { orders: {} } }, { orders: contract }, undefined, { resolve });
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
  const dynamic = createApps({ name: "dynamic", version: "1", requires: { orders: {} } }, {}, undefined, { resolve });
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
  const untyped = createApps({ name: "untyped", version: "1", requires: { orders: {} } }, { orders: { tools: [{ name: "get_order", inputSchema: contract.tools[0].inputSchema }] } }, undefined, { resolve });
  assert.deepEqual(await untyped.orders.tools.get_order({ id: "bad" }), { total: "invalid" });
  assert.equal(await untyped.orders.tools.get_order({ id: "text" }), undefined);
});

test("endpoint bindings carry the auth provider and watch resources through subscriptions", { timeout: 20000 }, async t => {
  const summary = z.object({ total: z.number() });
  const uri = "orders://summary";
  let total = 1;
  const authorizations = [];
  const resourceServer = subscribe => serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" }, subscribe ? { capabilities: { resources: { subscribe: true } } } : {});
    server.registerResource("summary", uri, { mimeType: "application/json" }, () => ({ ttlMs: 0, cacheScope: "private", contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ total }) }] }));
    return server;
  }, req => authorizations.push(req.headers.authorization));
  const [live, plain] = await Promise.all([resourceServer(true), resourceServer(false)]);
  const { endpoint } = live;
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
  await assert.rejects(bindApps(identity, { orders: contract }, { orders: { endpoint: plain.endpoint } }).orders.resources[uri].watch(() => {}), /does not advertise resource subscriptions/);
});

test("resolve is consulted per call and session serves bindings without an endpoint", { timeout: 10000 }, async t => {
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("get_order", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }) => ({ content: [], structuredContent: { id } }));
    return server;
  });
  const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }], resources: [{ uri: "orders://summary", outputSchema: { type: "object", properties: { total: { type: "number" } }, required: ["total"] } }] };
  const identity = { name: "checkout", version: "1", requires: { orders: {} } };

  // resolve runs on every call, not at creation; scoped bindings reconnect per call.
  const resolved = [];
  let discoveries = 0;
  const fetching = async (input, init) => {
    if (typeof init?.body === "string" && JSON.parse(init.body).method === "server/discover") discoveries += 1;
    return fetch(input, init);
  };
  const resolving = createApps(identity, { orders: contract }, undefined, { resolve: name => { resolved.push(name); return { endpoint, fetch: fetching, scoped: true }; } });
  assert.deepEqual(resolved, []);
  assert.deepEqual(await resolving.orders.tools.get_order({ id: "a" }), { id: "a" });
  assert.deepEqual(await resolving.orders.tools.get_order({ id: "b" }), { id: "b" });
  assert.deepEqual(resolved, ["orders", "orders"]);
  assert.equal(discoveries, 2);

  // session receives (name, binding) and its return value serves calls and reads.
  const sessions = [];
  const calls = [];
  const binding = { token: "opaque" };
  const session = (name, value) => {
    sessions.push([name, value]);
    return value === binding ? {
      callTool: async (request, options) => { calls.push(["call", request, options?.signal]); return { content: [], structuredContent: { id: request.arguments.id } }; },
      readResource: async request => { calls.push(["read", request]); return { contents: [{ uri: request.uri, text: '{"total":7}' }] }; },
      listTools: async () => ({ tools: [] }),
    } : undefined;
  };
  const signal = new AbortController().signal;
  const hosted = bindApps(identity, { orders: contract }, { orders: binding }, { session });
  assert.deepEqual(sessions, [["orders", binding]]);
  assert.deepEqual(await hosted.orders.tools.get_order({ id: "s" }, { signal }), { id: "s" });
  assert.deepEqual(await hosted.orders.resources["orders://summary"].read(), { total: 7 });
  assert.deepEqual(calls, [["call", { name: "get_order", arguments: { id: "s" } }, signal], ["read", { uri: "orders://summary" }]]);
  await assert.rejects(hosted.orders.resources["orders://summary"].watch(() => {}), /endpoint binding/);
  // A binding the session declines and that has no endpoint cannot be served.
  await assert.rejects(bindApps(identity, { orders: contract }, { orders: {} }, { session }).orders.tools.get_order({ id: "x" }), /^Error: Dependency orders binding has no endpoint\.$/);

  // Without a binding, a declared dependency is unavailable and an undeclared one is reported as such.
  await assert.rejects(createApps(identity, { orders: contract }).orders.tools.get_order({ id: "x" }), { message: "Dependency orders is unavailable. Provide a binding." });
  await assert.rejects(createApps({ name: "checkout", version: "1" }, { orders: contract }).orders.tools.get_order({ id: "x" }), { message: "Dependency orders is not declared by this application." });
  // Explicit bindings switch resolve off for every app.
  await assert.rejects(createApps(identity, { orders: contract, other: null }, { other: { endpoint } }, { resolve: () => assert.fail("resolve with explicit bindings") }).orders.tools.get_order({ id: "x" }), { message: "Dependency orders is unavailable. Provide a binding." });
});

test("createApps validates with the caller's validator when one is given", async () => {
  const schemas = [];
  const validator = schema => { schemas.push(schema); return Object.assign(() => false, { errors: ["rejected"] }); };
  const contracts = { orders: { tools: [{ name: "get", inputSchema: { type: "object" } }] } };
  const session = () => ({ callTool: () => assert.fail("invalid arguments reached the session"), readResource: () => assert.fail("unexpected read"), listTools: () => assert.fail("unexpected list") });
  const apps = bindApps({ name: "checkout", version: "1", requires: {} }, contracts, { orders: { session: true } }, { validator, session });
  await assert.rejects(apps.orders.tools.get({}), /Invalid arguments for orders\.get: \["rejected"\]/);
  assert.deepEqual(schemas, [{ type: "object" }]);
});

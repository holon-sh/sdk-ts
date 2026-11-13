import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { McpServer, CLIENT_INFO_META_KEY } from "@modelcontextprotocol/server";
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from "@modelcontextprotocol/client";
import { z } from "zod";
import { createApps, bindApps, ToolCallError, type ToolSession } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { serve } from "./helpers.ts";

test("tools return output or throw while callTool preserves MCP results and identity", {timeout: 10000}, async t => {
  const input = z.strictObject({ id: z.string(), limit: z.number().default(5) });
  const output = z.object({ total: z.number() });
  const identities: string[] = [];
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("get_order", { inputSchema: input }, async (args, ctx) => {
      // The SDK leaves the request envelope untyped.
      identities.push((ctx.mcpReq.envelope as Record<string, { name: string }>)[CLIENT_INFO_META_KEY].name);
      if (args.id === "error") return { isError: true, content: [{ type: "text", text: "Unavailable" }], structuredContent: "failure", _meta: { preserved: true } };
      if (args.id === "input") return { resultType: "input_required", requestState: "opaque-state" };
      if (args.id === "text") return { content: [{ type: "text", text: '{"total":5}' }] };
      return { content: [{ type: "text", text: "Order" }], structuredContent: { total: args.id === "bad" ? "invalid" : args.limit } };
    });
    return server;
  });
  // No explicit bindings: the resolve hook binds every declared dependency, one connection per call.
  const resolve = (name: string) => name === "orders" ? { endpoint, scoped: true } : undefined;
  const contract = { tools: [{ name: "get_order", inputSchema: z.toJSONSchema(input, { io: "input" }), outputSchema: z.toJSONSchema(output) }] };
  const make = (name: string) => createApps({ name, version: "1", requires: { orders: {} } }, { orders: contract }, undefined, { resolve });
  const first = make("first");
  const second = make("second");
  const results = await Promise.all([first.orders.tools.get_order({ id: "valid" }), second.orders.callTool({ name: "get_order", arguments: { id: "valid", limit: 2 } })]);
  assert.deepEqual(results[0], { total: 5 });
  assert.equal(results[1].resultType, "complete");
  assert.deepEqual(results[1].structuredContent, { total: 2 });
  assert.deepEqual(identities.sort(), ["first", "second"]);
  const error = await first.orders.callTool({ name: "get_order", arguments: { id: "error" } });
  assert.equal(error.structuredContent, "failure");
  assert.equal(error._meta?.preserved, true);
  const incomplete = await first.orders.callTool({ name: "get_order", arguments: { id: "input" } });
  assert.equal(incomplete.resultType, "input_required");
  assert.equal(incomplete.requestState, "opaque-state");
  for (const [id, result] of [["error", error], ["input", incomplete]]) {
    await assert.rejects(first.orders.tools.get_order({ id }), thrown => {
      assert.ok(thrown instanceof ToolCallError);
      assert.deepEqual(thrown.result, result);
      return true;
    });
  }
  await assert.rejects(first.orders.callTool({ name: "absent", arguments: {} }), /Unknown tool orders\.absent/);
  await assert.rejects(first.orders.callTool({ name: "get_order", arguments: { id: "bad" } }), /Invalid structured output/);
  await assert.rejects(first.orders.tools.get_order({ id: "text" }), /Invalid structured output/);
});

test("endpoint bindings carry the auth provider and watch resources through subscriptions", { timeout: 20000 }, async t => {
  const summary = z.object({ total: z.number() });
  const uri = "orders://summary";
  let total = 1;
  const authorizations: unknown[] = [];
  const installations: unknown[] = [];
  const resourceServer = (subscribe: boolean) => serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" }, subscribe ? { capabilities: { resources: { subscribe: true } } } : {});
    server.registerResource("summary", uri, { mimeType: "application/json" }, () => ({ ttlMs: 0, cacheScope: "private", contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ total }) }] }));
    return server;
  }, req => { authorizations.push(req.headers.authorization); installations.push(req.headers["x-holon-installation-uid"]); });
  const [live, plain] = await Promise.all([resourceServer(true), resourceServer(false)]);
  const { endpoint } = live;
  const contract = { tools: [], resources: [{ uri, outputSchema: z.toJSONSchema(summary) }] };
  const identity = { name: "script", version: "1", requires: {} };
  assert.throws(() => bindApps(identity, { orders: contract }, { missing: { endpoint } }), /Unknown app binding/);
  const bound = bindApps(identity, { orders: contract }, { orders: { endpoint, authProvider: { token: async () => "external" }, installationUID: "installation-one" } });
  t.after(() => bound.orders.close());
  assert.deepEqual(await bound.orders.resources[uri].read(), { total: 1 });
  assert.ok(authorizations.length > 0 && authorizations.every(value => value === "Bearer external"), JSON.stringify(authorizations));
  assert.ok(installations.length > 0 && installations.every(value => value === "installation-one"), JSON.stringify(installations));

  const seen: unknown[] = [];
  const arrivals: Array<() => void> = [];
  const next = () => new Promise<void>(resolve => arrivals.push(resolve));
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

  await assert.rejects(createApps({ ...identity, requires: { orders: {} } }, { orders: contract }).orders.resources[uri].watch(() => {}), /ORDERS_MCP_URL/);
  await assert.rejects(bindApps(identity, { orders: contract }, { orders: { endpoint: plain.endpoint } }).orders.resources[uri].watch(() => {}), /does not advertise resource subscriptions/);
});

test("session bindings serve calls and reads and respect validation and binding boundaries", async () => {
  const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }], resources: [{ uri: "orders://summary", outputSchema: { type: "object", properties: { total: { type: "number" } }, required: ["total"] } }] };
  const identity = { name: "checkout", version: "1", requires: { orders: {} } };

  // A session binding's session serves calls and reads; watching and MCP Events need an endpoint, and a bound app never
  // falls back to resolve or <NAME>_MCP_URL, which a page in a browser cannot read.
  const calls: unknown[] = [];
  const signal = new AbortController().signal;
  const session: ToolSession = {
    callTool: async (request, options) => { calls.push(["call", request, options?.signal === signal]); return { content: [], structuredContent: { id: request.arguments?.id } }; },
    readResource: async request => { calls.push(["read", request]); return { contents: [{ uri: request.uri, text: '{"total":7}' }] }; },
    listTools: async () => ({ tools: [] }),
  };
  const hosted = bindApps(identity, { orders: contract }, { orders: { session } });
  assert.deepEqual((await hosted.orders.tools.get_order({ id: "s" }, { signal }) as CompleteResult<unknown>).structuredContent, { id: "s" });
  assert.deepEqual(await hosted.orders.resources["orders://summary"].read(), { total: 7 });
  assert.deepEqual(calls, [["call", { name: "get_order", arguments: { id: "s" } }, true], ["read", { uri: "orders://summary" }]]);
  await assert.rejects(hosted.orders.resources["orders://summary"].watch(() => {}), /endpoint binding/);
  await assert.rejects(hosted.orders.ext.events.subscribe("shipped", {}), /endpoint binding/);
  // @ts-expect-error A session is the binding, not an option.
  bindApps(identity, { orders: contract }, { orders: { session } }, { session: () => session });

  // Without a binding, a declared dependency is unavailable, from the environment or from a resolve hook that binds nothing.
  await assert.rejects(createApps(identity, { orders: contract }).orders.tools.get_order({ id: "x" }), /Dependency orders is unavailable \(ORDERS_MCP_URL\)/);
  await assert.rejects(createApps(identity, { orders: contract }, undefined, { resolve: () => undefined }).orders.tools.get_order({ id: "x" }), /Dependency orders is unavailable/);
  const validator = (schema: object) => { assert.deepEqual(schema, contract.resources[0].outputSchema); return Object.assign(() => false, { errors: ["rejected"] }); };
  await assert.rejects(bindApps(identity, { orders: contract }, { orders: { session } }, { validator }).orders.resources["orders://summary"].read(), /Invalid contents from orders orders:\/\/summary: \["rejected"\]/);
});

test("a failure carries the server's text and its JSON", { timeout: 10000 }, async t => {
  const problem = { type: "about:blank", title: "Conflict", status: 409 };
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "files", version: "1" });
    server.registerTool("export", {}, async () => ({ isError: true, content: [{ type: "text", text: JSON.stringify(problem) }] }));
    return server;
  });
  const contract = { tools: [{ name: "export", inputSchema: { type: "object" } }] };
  const { files } = bindApps({ name: "script", version: "1" }, { files: contract }, { files: { endpoint, scoped: true } });
  await assert.rejects(files.tools.export({}), error => {
    assert.ok(error instanceof ToolCallError);
    assert.deepEqual(error.data, problem);
    assert.equal(error.text, JSON.stringify(problem));
    assert.ok(error.message.includes(JSON.stringify(problem)));
    return true;
  });
});

test("a call without a timeout waits past the MCP client's default, and progress restarts a timeout", { timeout: 10000 }, async t => {
  const checkpoints: Array<() => void> = [];
  let arrived: (() => void) | undefined;
  const checkpoint = () => new Promise<void>(resume => { checkpoints.push(resume); arrived?.(); });
  const reached = async () => { while (!checkpoints.length) await new Promise<void>(resolve => (arrived = resolve)); return checkpoints.shift()!; };
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "builds", version: "1" });
    server.registerTool("build", { inputSchema: z.object({ progress: z.boolean() }) }, async ({ progress }, ctx) => {
      const progressToken = ctx.mcpReq._meta?.progressToken;
      await checkpoint();
      if (progress) {
        await ctx.mcpReq.notify({ method: "notifications/progress", params: { progressToken, progress: 1 } });
        await checkpoint();
      }
      return { content: [{ type: "text", text: "built" }] };
    });
    return server;
  });
  const contract = { tools: [{ name: "build", inputSchema: { type: "object" } }] };
  const { builds } = bindApps({ name: "script", version: "1" }, { builds: contract }, { builds: { endpoint } });
  t.after(() => builds.close());
  // The session connects before timers are faked.
  await builds.listTools();
  t.mock.timers.enable({ apis: ["setTimeout"] });

  const unbounded = builds.tools.build({ progress: false });
  let resume = await reached();
  t.mock.timers.tick(DEFAULT_REQUEST_TIMEOUT_MSEC + 1);
  resume();
  // build has no output schema, so the tool returns its complete result.
  assert.deepEqual((await unbounded as CompleteResult<unknown>).content, [{ type: "text", text: "built" }]);

  let progressed: () => void;
  const kept = builds.tools.build({ progress: true }, { timeout: 1000, onprogress: () => progressed() });
  resume = await reached();
  t.mock.timers.tick(800);
  await new Promise<void>(resolve => { progressed = resolve; resume(); });
  resume = await reached();
  t.mock.timers.tick(800);
  resume();
  assert.deepEqual((await kept as CompleteResult<unknown>).content, [{ type: "text", text: "built" }]);
});

test("schemas that share an $id validate independently", async () => {
  const $id = "https://contract.example/result";
  const contract = { tools: [
    { name: "total", inputSchema: { type: "object" }, outputSchema: { $id, type: "object", required: ["total"] } },
    { name: "status", inputSchema: { type: "object" }, outputSchema: { $id, type: "object", required: ["status"] } },
  ] };
  const session: ToolSession = {
    callTool: async request => ({ content: [], structuredContent: request.name === "total" ? { total: 1 } : { status: "ok" } }),
    readResource: async () => ({ contents: [] }),
    listTools: async () => ({ tools: [] }),
  };
  const { results } = bindApps({ name: "script", version: "1" }, { results: contract }, { results: { session } });
  assert.deepEqual([await results.tools.total({}), await results.tools.status({})], [{ total: 1 }, { status: "ok" }]);
});

test("a typed call validates its output where code generation is disallowed, as in a view", { timeout: 10000 }, async t => {
  let calls = 0;
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "orders", version: "1" });
    server.registerTool("total", {}, async () => ({ content: [], structuredContent: { total: calls++ ? "one" : 1 } }));
    return server;
  });
  // A view's bundle resolves the browser condition, and an MCP Apps host's CSP gives it no unsafe-eval: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx#host-behavior
  const view = `
    import assert from "node:assert/strict";
    import { bindApps } from "holon-sh/runtime";
    const contract = { tools: [{ name: "total", inputSchema: { type: "object" }, outputSchema: { type: "object", properties: { total: { type: "number" } }, required: ["total"] } }] };
    const { orders } = bindApps({ name: "view", version: "1" }, { orders: contract }, { orders: { endpoint: process.argv[1], scoped: true } });
    assert.deepEqual(await orders.tools.total({}), { total: 1 });
    await assert.rejects(orders.tools.total({}), /Invalid structured output from orders.total/);
  `;
  await promisify(execFile)(process.execPath, ["--conditions=browser", "--disallow-code-generation-from-strings", "--input-type=module", "-e", view, endpoint], { cwd: import.meta.dirname });
});

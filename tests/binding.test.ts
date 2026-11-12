import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { listen, serve, serveLegacy } from "./helpers.ts";

function orders() {
  const server = new McpServer({ name: "orders", version: "1" });
  server.registerTool("get_order", { inputSchema: z.strictObject({ id: z.string() }) }, async ({ id }) => ({ content: [], structuredContent: { id } }));
  return server;
}

const contract = { tools: [{ name: "get_order", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false } }] };
const identity = { name: "checkout", version: "1", requires: { orders: {}, payments: {} } };

function environment(t: TestContext, variables: Record<string, string>) {
  const saved = process.env;
  process.env = { ...saved, ...variables };
  t.after(() => { process.env = saved; });
}

async function record(t: TestContext, target: () => string) {
  const sent: string[] = [];
  const endpoint = await listen(t, createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const method = body.length ? JSON.parse(String(body)).method : req.method;
    if (["server/discover", "initialize", "tools/call", "DELETE"].includes(method)) sent.push(method);
    const forwarded = request(target(), { method: req.method, headers: req.headers }, reply => reply.pipe(res.writeHead(reply.statusCode!, reply.headers)));
    res.on("close", () => forwarded.destroy());
    forwarded.end(body);
  }));
  return { endpoint, sent: () => sent.splice(0) };
}

test("a resolved binding keeps one session and reconnects after close, clients declare on every request that they can be asked and take files, and the environment fallback is scoped with the environment's bearer token", { timeout: 10000 }, async t => {
  environment(t, { PAYMENTS_MCP_URL: "" });
  const authorization = new Set();
  const { endpoint } = await serve(t, orders, req => authorization.add(req.headers.authorization));
  // Each new connection starts by discovering the server.
  let connections = 0;
  const capabilities = new Set();
  const counting: typeof fetch = async (input, init) => {
    if (typeof init?.body === "string") {
      const { method, params } = JSON.parse(init.body);
      if (method === "server/discover") connections += 1;
      capabilities.add(JSON.stringify(params._meta[CLIENT_CAPABILITIES_META_KEY]));
    }
    return fetch(input, init);
  };
  // get_order has no output schema, so the tool returns its complete result.
  const resolved = createApps(identity, { orders: contract }, undefined, { resolve: app => app === "orders" ? { endpoint, fetch: counting } : undefined });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "a" }) as CompleteResult<unknown>).structuredContent, { id: "a" });
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "b" }) as CompleteResult<unknown>).structuredContent, { id: "b" });
  assert.equal(connections, 1);
  assert.deepEqual([...capabilities], ['{"elicitation":{"form":{},"url":{}},"extensions":{"io.modelcontextprotocol/files":{"upload":{},"download":{}}}}']);
  await resolved.orders.close();
  assert.deepEqual((await resolved.orders.tools.get_order({ id: "c" }) as CompleteResult<unknown>).structuredContent, { id: "c" });
  assert.equal(connections, 2);
  await resolved.orders.close();
  const apps = createApps(identity, { orders: contract });
  const relay = await record(t, () => endpoint);
  // The Node environment fallback is scoped and consulted on every call.
  process.env.PAYMENTS_MCP_URL = relay.endpoint;
  // payments has no contract: an untyped client that calls any tool without validation. PAYMENTS_MCP_TOKEN is read on every call too and sent as the bearer token.
  for (const [id, token, header] of [["d", "", undefined], ["e", "secret", "Bearer secret"]]) {
    process.env.PAYMENTS_MCP_TOKEN = token;
    authorization.clear();
    assert.deepEqual((await apps.payments.callTool({ name: "get_order", arguments: { id } })).structuredContent, { id });
    assert.deepEqual([...authorization], [header]);
  }
  assert.deepEqual(relay.sent(), ["server/discover", "tools/call", "server/discover", "tools/call"]);
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

test("environment-bound calls end 2025-era sessions and reuse the legacy verdict until it expires or the server upgrades", { timeout: 10000 }, async t => {
  const legacy = await serveLegacy(t, orders);
  const modern = await serve(t, orders);
  let upgraded = false;
  const { endpoint, sent } = await record(t, () => upgraded ? modern.endpoint : legacy.endpoint);
  environment(t, { ORDERS_MCP_URL: endpoint });
  t.mock.timers.enable({ apis: ["Date"], now: Date.now() });
  const { orders: app } = createApps(identity, { orders: contract });
  const call = () => app.callTool({ name: "get_order", arguments: { id: "a" } });
  await call();
  await call();
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE", "initialize", "tools/call", "DELETE"]);
  t.mock.timers.tick(10 * 60 * 1000);
  await call();
  assert.deepEqual(sent(), ["server/discover", "initialize", "tools/call", "DELETE"]);
  upgraded = true;
  await call();
  assert.deepEqual(sent(), ["initialize", "server/discover", "tools/call"]);
});

test("an environment-bound call follows no redirect, not even within its origin", { timeout: 10000 }, async t => {
  const reached: unknown[] = [];
  const endpoint = await listen(t, createServer((req, res) => {
    if (req.url === "/mcp") return void res.writeHead(307, { location: "/moved" }).end();
    reached.push(req.url);
    res.writeHead(404).end();
  }));
  environment(t, { ORDERS_MCP_URL: endpoint });
  await assert.rejects(createApps(identity, { orders: contract }).orders.callTool({ name: "get_order", arguments: { id: "a" } }));
  assert.deepEqual(reached, []);
});

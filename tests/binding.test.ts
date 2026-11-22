import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { McpServer, CLIENT_CAPABILITIES_META_KEY } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { listen, serve } from "./helpers.ts";

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

async function refusingDiscovery(t: TestContext, target: string) {
  const sent: string[] = [];
  const endpoint = await listen(t, createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const { id, method } = body.length ? JSON.parse(String(body)) : { id: undefined, method: req.method };
    sent.push(`${method} ${req.headers["mcp-protocol-version"]}`);
    if (method === "server/discover") return void res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ jsonrpc: "2.0", id, error: { code: 1001, message: "Connect your account to continue." } }));
    const forwarded = request(target, { method: req.method, headers: req.headers }, reply => reply.pipe(res.writeHead(reply.statusCode!, reply.headers)));
    res.on("close", () => forwarded.destroy());
    forwarded.end(body);
  }));
  return { endpoint, sent };
}

test("a resolved binding keeps one session and reconnects after close, clients declare on every request that they can be asked and take files, and the environment fallback is read on every call with the environment's bearer token", { timeout: 10000 }, async t => {
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
  const resolved = createApps(identity, { orders: contract }, undefined, { resolve: app => app === "orders" ? { endpoint, fetch: counting } : undefined });
  await resolved.orders.tools.get_order({ id: "a" });
  await resolved.orders.tools.get_order({ id: "b" });
  assert.equal(connections, 1);
  assert.deepEqual([...capabilities], ['{"elicitation":{"form":{},"url":{}},"extensions":{"io.modelcontextprotocol/files":{"upload":{},"download":{}}}}']);
  await resolved.orders.close();
  await resolved.orders.tools.get_order({ id: "c" });
  assert.equal(connections, 2);
  await resolved.orders.close();
  const apps = createApps(identity, { orders: contract });
  // The Node environment fallback is consulted on every call.
  process.env.PAYMENTS_MCP_URL = endpoint;
  // payments has no contract: an untyped client that calls any tool without validation. PAYMENTS_MCP_TOKEN is read on every call too and sent as the bearer token.
  for (const [id, token, header] of [["d", "", undefined], ["e", "secret", "Bearer secret"]]) {
    process.env.PAYMENTS_MCP_TOKEN = token;
    authorization.clear();
    await apps.payments.callTool({ name: "get_order", arguments: { id } });
    assert.deepEqual([...authorization], [header]);
  }
  const { tools } = await apps.payments.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ["get_order"]);
});

test("environment-bound calls speak 2026-07-28 without discovering the server, so a server that refuses discovery still answers them", { timeout: 10000 }, async t => {
  const { endpoint, sent } = await refusingDiscovery(t, (await serve(t, orders)).endpoint);
  environment(t, { ORDERS_MCP_URL: endpoint });
  const result = await createApps(identity, { orders: contract }).orders.callTool({ name: "get_order", arguments: { id: "a" } });
  assert.deepEqual(result.structuredContent, { id: "a" });
  assert.deepEqual(sent, ["tools/call 2026-07-28"]);
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

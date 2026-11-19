import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { listen, serve as serveMcp, temporary } from "./helpers.ts";

const repository = dirname(import.meta.dirname);
const TRACE = "0af7651916cd43dd8448eb211c80319c";
const INCOMING = `00-${TRACE}-b7ad6b7169203331-01`;

// An app whose relay tool calls its peer dependency, run by holon-serve in its own process, where serve's setup is the
// only OpenTelemetry registration.
async function app(t: TestContext, env: Record<string, string>) {
  const root = temporary(t);
  const imports = ["holon-sh/runtime", "@modelcontextprotocol/server"].map(name => JSON.stringify(import.meta.resolve(name)));
  writeFileSync(join(root, "app.mjs"), `
    import { createApps } from ${imports[0]};
    import { createMcpHandler, McpServer } from ${imports[1]};
    const identity = { name: "relay-app", version: "1.0.0", requires: { peer: {} } };
    export default createMcpHandler(() => {
      const server = new McpServer({ name: "relay-app", version: "1.0.0" });
      server.registerTool("relay", {}, async () => {
        await createApps(identity, {}).peer.callTool({ name: "echo", arguments: {} });
        return { content: [] };
      });
      return server;
    });
  `);
  const { bin } = JSON.parse(readFileSync(join(repository, "packages/node/package.json"), "utf8"));
  const child = spawn(process.execPath, [join(repository, "packages/node", bin["holon-serve"]), join(root, "app.mjs")], {
    env: { ...process.env, PORT: "0", OTEL_SERVICE_NAME: "relay-app", OTEL_RESOURCE_ATTRIBUTES: "holon.session=s1", ...env },
    stdio: ["ignore", "pipe", "inherit"],
  });
  t.after(() => child.kill("SIGKILL"));
  const lines = createInterface({ input: child.stdout! })[Symbol.asyncIterator]();
  const origin = /http:\/\/[^/]+/.exec((await lines.next()).value)![0];
  const client = new Client({ name: "test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("traceparent", INCOMING);
      return fetch(input, { ...init, headers });
    },
  }));
  t.after(() => client.close());
  return { child, relay: () => client.callTool({ name: "relay", arguments: {} }) };
}

async function peer(t: TestContext) {
  const received: Array<{ header?: string; meta?: unknown }> = [];
  const headers: string[] = [];
  const { endpoint } = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("echo", {}, async ctx => { received.push({ meta: ctx.mcpReq._meta?.traceparent }); return { content: [] }; });
    return server;
  }, req => { if (req.headers.traceparent) headers.push(String(req.headers.traceparent)); });
  return { endpoint, received, headers };
}

test("without an OTLP endpoint, holon-serve exports nothing and still passes the caller's trace to dependencies", { timeout: 15000 }, async t => {
  const { endpoint, received, headers } = await peer(t);
  const { child, relay } = await app(t, { PEER_MCP_URL: endpoint, OTEL_EXPORTER_OTLP_ENDPOINT: "" });
  await relay();
  // No provider records spans, so the dependency continues the caller's own span.
  assert.equal(received[0]?.meta, INCOMING);
  assert.ok(headers.includes(INCOMING), JSON.stringify(headers));
  child.kill("SIGTERM");
  assert.deepEqual(await once(child, "exit"), [0, null]);
});

test("with an OTLP endpoint, holon-serve exports its spans, named for the app and its session, and flushes them on SIGTERM", { timeout: 15000 }, async t => {
  const exports: Array<{ path: string; type: string; body: Buffer }> = [];
  const collector = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    exports.push({ path: req.url ?? "", type: req.headers["content-type"] ?? "", body: Buffer.concat(chunks) });
    res.writeHead(200, { "content-type": "application/x-protobuf" }).end();
  });
  const otlp = (await listen(t, collector)).replace(/\/mcp$/, "");
  const { endpoint, received } = await peer(t);
  const { child, relay } = await app(t, { PEER_MCP_URL: endpoint, OTEL_EXPORTER_OTLP_ENDPOINT: otlp });
  await relay();
  // The dependency's parent is now the app's own client span, in the caller's trace.
  assert.match(String(received[0]?.meta), new RegExp(`^00-${TRACE}-(?!b7ad6b7169203331)[0-9a-f]{16}-01$`));
  child.kill("SIGTERM");
  assert.deepEqual(await once(child, "exit"), [0, null]);
  const traces = exports.filter(({ path }) => path === "/v1/traces");
  assert.ok(traces.length, JSON.stringify(exports.map(({ path }) => path)));
  const body = Buffer.concat(traces.map(({ body }) => body));
  assert.match(traces[0]!.type, /protobuf/);
  for (const text of ["relay-app", "holon.session", "s1", "tools/call relay", "tools/call echo", "holon.callee"])
    assert.ok(body.includes(text), `exported spans lack ${text}`);
  assert.ok(body.includes(Buffer.from(TRACE, "hex")), "exported spans lack the caller's trace ID");
});

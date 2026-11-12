import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdirSync, writeFileSync } from "node:fs";
import { request, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { createApps } from "holon-sh/runtime";
import { getContext } from "holon-sh/context";
import { serve, type App } from "holon-sh/serve";
import { temporary } from "./helpers.ts";

// Sends a path as written, where fetch would resolve its dots first.
async function get(origin: string, path: string, method = "GET") {
  const response = await new Promise<IncomingMessage>(resolve => request(origin, { path, method }, resolve).end());
  let body = "";
  for await (const chunk of response) body += chunk;
  const { "content-type": type, "x-content-type-options": sniffing } = response.headers;
  return { status: response.statusCode, type, sniffing, body };
}

test("serve runs an app without Holon: its MCP endpoint for clients of every version, and its page", { timeout: 10000 }, async t => {
  const root = temporary(t);
  mkdirSync(join(root, "web"));
  const files = [["web/index.html", "<p>page</p>"], ["web/app.mjs", "page()"], ["web/data", "bytes"], ["web/.env", "hidden"], ["secret", "outside"]];
  for (const [name, text] of files) writeFileSync(join(root, name!), text!);
  // An app links to itself at its origin.
  const mcp = createMcpHandler(() => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("origin", {}, ctx => ({ content: [{ type: "text", text: `${getContext(ctx.http).origin}` }] }));
    return server;
  });
  // At /mcp/idle, the app answers with a stream that sends one event and then waits.
  let idle!: Request;
  let cancelled!: () => void;
  const left = new Promise<void>(resolve => (cancelled = resolve));
  const fetch = (request: Request) => {
    if (new URL(request.url).pathname !== "/mcp/idle") return mcp.fetch(request);
    idle = request;
    const event = new TextEncoder().encode("data: {}\n\n");
    return Promise.resolve(new Response(new ReadableStream({ start: stream => stream.enqueue(event), cancel: cancelled })));
  };
  process.env.PORT = "0";
  const start = async (app: App) => {
    const server = await serve(app);
    t.after(() => {
      server.closeAllConnections();
      server.close();
    });
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };
  const origin = await start({ default: { fetch }, frontend: pathToFileURL(join(root, "web/")) });

  const { app } = createApps({ name: "test", version: "1.0.0" }, { app: null }, { app: { endpoint: `${origin}/mcp` } });
  t.after(() => app!.close());
  assert.deepEqual((await app!.callTool({ name: "origin", arguments: {} })).content, [{ type: "text", text: origin }]);

  // A 2025 client, behind a proxy that forwards its own origin.
  const legacy = (message: object) =>
    globalThis.fetch(`${origin}/mcp/app`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
        "x-forwarded-host": "app.example",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({ jsonrpc: "2.0", ...message }),
    });
  const called = await legacy({ id: 1, method: "tools/call", params: { name: "origin", arguments: {} } });
  assert.match(await called.text(), /"text":"https:\/\/app\.example"/);
  // Streamable HTTP accepts a notification with 202 and no body.
  assert.equal((await legacy({ method: "notifications/initialized" })).status, 202);

  // A stream between events ends as soon as its client leaves, and the app hears that it left.
  const listening = request(`${origin}/mcp/idle`, { method: "POST" }).end();
  await once(listening, "response");
  listening.destroy();
  await Promise.all([left, idle.signal.aborted || once(idle.signal, "abort")]);

  const page = { status: 200, sniffing: "nosniff" };
  assert.deepEqual(await get(origin, "/"), { ...page, type: "text/html; charset=utf-8", body: "<p>page</p>" });
  assert.deepEqual(await get(origin, "/app.mjs", "HEAD"), { ...page, type: "text/javascript; charset=utf-8", body: "" });
  assert.deepEqual(await get(origin, "/data"), { ...page, type: "application/octet-stream", body: "bytes" });
  for (const [path, method] of [["/", "POST"], ["/missing"], ["/.env"], ["/%2Eenv"], ["/../secret"], ["/%2e%2e/secret"], ["/..%2fsecret"]])
    assert.equal((await get(origin, path!, method)).status, 404, `${method ?? "GET"} ${path}`);
  assert.equal((await get(await start({ default: { fetch } }), "/")).status, 404, "an app without a page has none");

  // A directory named without its trailing slash is still the directory, and not its parent.
  const unslashed = await start({ default: { fetch }, frontend: pathToFileURL(join(root, "web")) });
  assert.deepEqual([(await get(unslashed, "/")).body, (await get(unslashed, "/secret")).status], ["<p>page</p>", 404]);
});

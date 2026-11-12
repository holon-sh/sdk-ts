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
import { serve } from "holon-sh/serve";
import { temporary } from "./helpers.ts";

// Sends a path as written, where fetch would resolve its dots first.
async function get(origin: string, path: string, method = "GET") {
  const response = await new Promise<IncomingMessage>(resolve => request(origin, { path, method }, resolve).end());
  let body = "";
  for await (const chunk of response) body += chunk;
  return { status: response.statusCode, type: response.headers["content-type"], body };
}

test("serve runs an app without Holon: its MCP endpoint for clients of every version, and its page", { timeout: 10000 }, async t => {
  const root = temporary(t);
  mkdirSync(join(root, "web"));
  for (const [name, text] of [["web/index.html", "<p>page</p>"], ["web/app.js", "page()"], ["web/.env", "hidden"], ["secret", "outside"]])
    writeFileSync(join(root, name), text);
  // An app links to itself at the origin Holon forwards.
  const mcp = createMcpHandler(({ requestInfo }) => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("origin", {}, () => {
      const headers = requestInfo!.headers;
      return { content: [{ type: "text", text: `${headers.get("x-forwarded-proto")}://${headers.get("x-forwarded-host")}` }] };
    });
    return server;
  });
  // At /mcp/idle, the app answers with a stream that sends one event and then waits.
  let cancelled!: (signal: AbortSignal) => void;
  const left = new Promise<AbortSignal>(resolve => (cancelled = resolve));
  const idle = (signal: AbortSignal) =>
    new ReadableStream({ start: stream => stream.enqueue(new TextEncoder().encode("data: {}\n\n")), cancel: () => cancelled(signal) });
  const fetch = (request: Request) =>
    new URL(request.url).pathname === "/mcp/idle" ? Promise.resolve(new Response(idle(request.signal))) : mcp.fetch(request);
  process.env.PORT = "0";
  const server = await serve({ default: { fetch }, frontend: pathToFileURL(join(root, "web/")) });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const { app } = createApps({ name: "test", version: "1.0.0" }, { app: null }, { app: { endpoint: `${origin}/mcp` } });
  t.after(() => app!.close());
  assert.deepEqual((await app!.callTool({ name: "origin", arguments: {} })).content, [{ type: "text", text: origin }]);

  // A 2025 client, behind a proxy that forwards its own origin.
  const legacy = (method: string, params: object) =>
    globalThis.fetch(`${origin}/mcp/app`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
        "x-forwarded-host": "app.example",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }).then(response => response.text());
  const initialize = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "old", version: "1.0.0" } };
  assert.match(await legacy("initialize", initialize), /"protocolVersion":"2025-06-18"/);
  assert.match(await legacy("tools/call", { name: "origin", arguments: {} }), /"text":"https:\/\/app.example"/);

  // A stream between events ends as soon as its client leaves, and the app hears that it left.
  const listening = request(`${origin}/mcp/idle`, { method: "POST" }).end();
  await once(listening, "response");
  listening.destroy();
  assert.equal((await left).aborted, true);

  assert.deepEqual(await get(origin, "/"), { status: 200, type: "text/html; charset=utf-8", body: "<p>page</p>" });
  assert.deepEqual(await get(origin, "/app.js", "HEAD"), { status: 200, type: "text/javascript; charset=utf-8", body: "" });
  for (const [path, method] of [["/", "POST"], ["/missing"], ["/.env"], ["/%2Eenv"], ["/../secret"], ["/%2e%2e/secret"], ["/..%2fsecret"]])
    assert.equal((await get(origin, path!, method)).status, 404, `${method ?? "GET"} ${path}`);
});

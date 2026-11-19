import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { context, propagation, ROOT_CONTEXT, SpanKind, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { InMemorySpanExporter, SimpleSpanProcessor, TracerProvider, type ReadableSpan } from "@opentelemetry/sdk-trace";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { createApps } from "holon-sh/runtime";
import { serve, type App } from "holon-sh/serve";
import { EXTENSION } from "holon-sh/ext/files";
import { createServer } from "node:http";
import { once } from "node:events";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { fromJsonSchema } from "@modelcontextprotocol/server";
import { serve as serveMcp, serveLegacy } from "./helpers.ts";

// The app's own OpenTelemetry SDK, registered before serve, which must keep it: every span lands in this exporter.
const exporter = new InMemorySpanExporter();
trace.setGlobalTracerProvider(new TracerProvider({ spanProcessors: [new SimpleSpanProcessor({ exporter })] }));
context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

const HEADER_TRACE = "0af7651916cd43dd8448eb211c80319c";
const META_TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
const parent = (traceId: string) => `00-${traceId}-b7ad6b7169203331-01`;

function environment(t: TestContext, variables: Record<string, string>) {
  const saved = process.env;
  process.env = { ...saved, ...variables };
  t.after(() => { process.env = saved; });
}

async function start(t: TestContext, server: (() => McpServer) | App["default"]) {
  // An endpoint makes serve try to register its own provider, which it must not do over the one above.
  environment(t, { PORT: "0", OTEL_SERVICE_NAME: "relay-app", OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:9" });
  const http = await serve({ default: typeof server === "function" ? createMcpHandler(server) : server });
  t.after(() => { http.closeAllConnections(); http.close(); });
  return `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`;
}

// A plain MCP client, which adds no trace context of its own: the test chooses the headers and _meta.
async function rawCall(t: TestContext, endpoint: string, name: string, { header, meta }: { header?: string; meta?: Record<string, unknown> }) {
  const client = new Client({ name: "test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint), {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (header) headers.set("traceparent", header);
      return fetch(input, { ...init, headers });
    },
  }));
  t.after(() => client.close());
  return client.callTool({ name, arguments: {}, ...(meta && { _meta: meta }) });
}

const named = (name: string, kind: SpanKind) => (span: ReadableSpan) => span.name === name && span.kind === kind;
const parentOf = (span: ReadableSpan) => span.parentSpanContext?.spanId;

test("a request continues the trace in its traceparent header, else in params._meta, and the header wins", { timeout: 10000 }, async t => {
  const endpoint = await start(t, () => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("noop", {}, async () => ({ content: [] }));
    return server;
  });
  const cases = [
    { header: parent(HEADER_TRACE), expected: HEADER_TRACE },
    { meta: { traceparent: parent(META_TRACE) }, expected: META_TRACE },
    { header: parent(HEADER_TRACE), meta: { traceparent: parent(META_TRACE) }, expected: HEADER_TRACE },
  ];
  for (const { expected, ...sent } of cases) {
    exporter.reset();
    await rawCall(t, endpoint, "noop", sent);
    const span = exporter.getFinishedSpans().find(named("tools/call noop", SpanKind.SERVER));
    assert.ok(span, JSON.stringify(exporter.getFinishedSpans().map(({ name }) => name)));
    assert.equal(span.spanContext().traceId, expected);
    assert.equal(parentOf(span), "b7ad6b7169203331");
    assert.deepEqual(
      { method: span.attributes["mcp.method.name"], tool: span.attributes["gen_ai.tool.name"], app: span.attributes["holon.app"] },
      { method: "tools/call", tool: "noop", app: "relay-app" },
    );
    assert.equal(span.attributes["error.type"], undefined);
  }
});

test("a call a handler makes carries its trace to the dependency in _meta and headers, and other _meta keys stay", { timeout: 10000 }, async t => {
  const seen: Array<{ header?: string; meta?: Record<string, unknown> }> = [];
  const headers: string[] = [];
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("echo", {}, async ctx => {
      seen.push({ meta: { ...ctx.mcpReq._meta } });
      return { content: [] };
    });
    server.registerTool("fail", {}, async () => ({ content: [], isError: true }));
    return server;
  }, req => { if (typeof req.headers.traceparent === "string") headers.push(req.headers.traceparent); });
  environment(t, { PEER_MCP_URL: peer.endpoint });
  // A generated identity's name may differ from the app's; OTEL_SERVICE_NAME, which Holon sets, names the caller.
  const identity = { name: "generated-name", version: "1.0.0", requires: { peer: {} } };
  const endpoint = await start(t, () => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("relay", {}, async () => {
      // Off the handler's own promise chain, as a tool's work often is.
      await new Promise(resolve => setTimeout(resolve, 1));
      await createApps(identity, {}).peer!.callTool({ name: "echo", arguments: {}, _meta: { custom: "kept", traceparent: "00-ffffffffffffffffffffffffffffffff-ffffffffffffffff-01" } });
      await createApps(identity, {}).peer!.callTool({ name: "fail", arguments: {} });
      return { content: [] };
    });
    return server;
  });

  exporter.reset();
  await rawCall(t, endpoint, "relay", { header: parent(HEADER_TRACE) });
  const spans = exporter.getFinishedSpans();
  const server = spans.find(named("tools/call relay", SpanKind.SERVER))!;
  const echo = spans.find(named("tools/call echo", SpanKind.CLIENT))!;
  const fail = spans.find(named("tools/call fail", SpanKind.CLIENT))!;
  assert.ok(server && echo && fail, JSON.stringify(spans.map(({ name, kind }) => [name, kind])));
  for (const span of [echo, fail]) {
    assert.equal(span.spanContext().traceId, HEADER_TRACE);
    assert.equal(parentOf(span), server.spanContext().spanId);
    assert.deepEqual(
      { callee: span.attributes["holon.callee"], kind: span.attributes["holon.callee.kind"], caller: span.attributes["holon.caller.app"] },
      { callee: "peer", kind: "app", caller: "relay-app" },
    );
  }
  assert.equal(echo.attributes["error.type"], undefined);
  assert.equal(fail.attributes["error.type"], "tool_error");

  // The dependency sees the client span, in _meta and in the header, and the caller's other _meta keys.
  const sent = `00-${HEADER_TRACE}-${echo.spanContext().spanId}-01`;
  assert.equal(seen[0]?.meta?.traceparent, sent);
  assert.equal(seen[0]?.meta?.custom, "kept");
  assert.ok(headers.includes(sent), JSON.stringify(headers));
});

test("a tool error and a JSON-RPC error set error.type on the server span as holon-api does", { timeout: 10000 }, async t => {
  const endpoint = await start(t, () => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("broken", {}, async () => ({ content: [{ type: "text", text: "no" }], isError: true }));
    return server;
  });
  exporter.reset();
  await rawCall(t, endpoint, "broken", {});
  await rawCall(t, endpoint, "missing", {}).catch(() => {});
  const spans = exporter.getFinishedSpans();
  assert.equal(spans.find(named("tools/call broken", SpanKind.SERVER))?.attributes["error.type"], "tool_error");
  // An unknown tool is the caller's error: its code is recorded, error.type is not.
  const missing = spans.find(named("tools/call missing", SpanKind.SERVER));
  assert.ok(missing);
  assert.match(String(missing.attributes["rpc.response.status_code"]), /^-3260[12]$/);
  assert.equal(missing.attributes["error.type"], undefined);
});

test("a dependency call outside any request starts its own trace at its client span",{ timeout: 10000 }, async t => {
  const metas: Array<Record<string, unknown> | undefined> = [];
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("echo", {}, async ctx => { metas.push(ctx.mcpReq._meta); return { content: [] }; });
    return server;
  });
  environment(t, { PEER_MCP_URL: peer.endpoint, OTEL_SERVICE_NAME: "" });
  exporter.reset();
  await context.with(ROOT_CONTEXT, () => createApps({ name: "x", version: "1", requires: { peer: {} } }, {}).peer!.callTool({ name: "echo", arguments: {} }));
  // Its own client span is the root, so the dependency's parent is that span: one trace starting at the caller.
  const [client] = exporter.getFinishedSpans().filter(named("tools/call echo", SpanKind.CLIENT));
  assert.ok(client);
  assert.equal(client.parentSpanContext, undefined);
  // Without OTEL_SERVICE_NAME, the identity names the caller.
  assert.equal(client.attributes["holon.caller.app"], "x");
  assert.equal(metas[0]?.traceparent, `00-${client.spanContext().traceId}-${client.spanContext().spanId}-0${TraceFlags.SAMPLED}`);
});

test("a page with no propagator keeps the traceparent it puts in _meta, so its own trace reaches the dependency", { timeout: 10000 }, async t => {
  const metas: Array<Record<string, unknown> | undefined> = [];
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("echo", {}, async ctx => { metas.push(ctx.mcpReq._meta); return { content: [] }; });
    return server;
  });
  environment(t, { PEER_MCP_URL: peer.endpoint });
  propagation.disable();
  t.after(() => propagation.setGlobalPropagator(new W3CTraceContextPropagator()));
  await createApps({ name: "x", version: "1", requires: { peer: {} } }, {}).peer!.callTool({ name: "echo", arguments: {}, _meta: { traceparent: parent(META_TRACE), kept: 1 } });
  assert.equal(metas[0]?.traceparent, parent(META_TRACE));
  assert.equal(metas[0]?.kept, 1);
});

test("connection handshakes get no span, even against a 2025-era server that initializes on every call", { timeout: 10000 }, async t => {
  const peer = await serveLegacy(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("echo", {}, async () => ({ content: [] }));
    return server;
  });
  environment(t, { PEER_MCP_URL: peer.endpoint });
  exporter.reset();
  for (let call = 0; call < 3; call++) await createApps({ name: "x", version: "1", requires: { peer: {} } }, {}).peer!.callTool({ name: "echo", arguments: {} });
  assert.deepEqual(exporter.getFinishedSpans().map(({ name }) => name), ["tools/call echo", "tools/call echo", "tools/call echo"]);
});

const toolCall = (name: string, padding = "") => JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: { padding } } });
const post = (endpoint: string, body: string) => fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body });

test("an HTTP failure without a JSON-RPC response, or a response stream that fails, is an error on the server span", { timeout: 10000 }, async t => {
  let reply = () => new Response("Service unavailable", { status: 503 });
  const endpoint = await start(t, { fetch: async () => reply() });
  exporter.reset();
  assert.equal((await post(endpoint, toolCall("down"))).status, 503);
  reply = () => new Response(new ReadableStream({ pull: controller => controller.error(new Error("broken")) }), { headers: { "content-type": "text/event-stream" } });
  await post(endpoint, toolCall("broken")).then(response => response.text()).catch(() => {});
  await new Promise(resolve => setTimeout(resolve, 50));
  const spans = exporter.getFinishedSpans();
  assert.equal(spans.find(named("tools/call down", SpanKind.SERVER))?.attributes["error.type"], "http_5xx");
  assert.equal(spans.find(named("tools/call broken", SpanKind.SERVER))?.attributes["error.type"], "transport");
});

test("the handler's own request body limit still applies to a body serve read", { timeout: 10000 }, async t => {
  const endpoint = await start(t, createMcpHandler(() => new McpServer({ name: "app", version: "1.0.0" }), { maxRequestBodySize: 256 }));
  assert.equal((await post(endpoint, toolCall("noop", "x".repeat(1024)))).status, 413);
});

test("a call cancelled after its response stream opened, on a kept connection, ends its span", { timeout: 10000 }, async t => {
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("wait", {}, async ctx => {
      await ctx.mcpReq.notify({ method: "notifications/progress", params: { progressToken: ctx.mcpReq._meta?.progressToken!, progress: 1 } });
      await new Promise(resolve => ctx.mcpReq.signal.addEventListener("abort", resolve));
      return { content: [] };
    });
    return server;
  });
  const { peer: client } = createApps({ name: "x", version: "1" }, { peer: null }, { peer: { endpoint: peer.endpoint } });
  t.after(() => client!.close());
  exporter.reset();
  const controller = new AbortController();
  // Progress arrives on the call's open event stream, so the transport's send has already resolved.
  await assert.rejects(client!.callTool({ name: "wait", arguments: {} }, { signal: controller.signal, onprogress: () => controller.abort() }));
  const span = exporter.getFinishedSpans().find(named("tools/call wait", SpanKind.CLIENT));
  assert.equal(span?.attributes["error.type"], "cancelled");
});

test("a call whose files go out of band records the upload request as a result, not an error", { timeout: 10000 }, async t => {
  const fileSchema = { type: "object", properties: { file: { type: "object", "x-mcp-file": { maxSize: 64 }, properties: { id: { type: "string" }, mimeType: { type: "string" }, size: { type: "integer" } }, required: ["id", "mimeType", "size"] } } };
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "files", version: "1" }, { capabilities: { extensions: { [EXTENSION]: { upload: {} } } } });
    server.registerTool("save", { inputSchema: fromJsonSchema(fileSchema) }, async (args, ctx) => ctx.mcpReq.requestState()
      ? { content: [] }
      : ({ resultType: "upload_required", content: [], requestState: "state", uploads: [{ fileId: (args as { file: { id: string } }).file.id, path: "/uploads/a", credentials: "omit" }] }) as never);
    return server;
  }, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => {
    if (req.url !== "/mcp") return void req.resume().on("end", () => res.writeHead(200).end());
    void dispatch(req, res).catch(() => res.destroy());
  });
  t.after(async () => { await handler.close(); http.closeAllConnections(); http.close(); });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const endpoint = `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`;
  const { files } = createApps({ name: "x", version: "1" }, { files: { tools: [{ name: "save", inputSchema: fileSchema }] } }, { files: { endpoint } });
  t.after(() => files!.close());
  exporter.reset();
  await files!.callTool({ name: "save", arguments: { file: new Blob(["hello"]) } });
  const spans = exporter.getFinishedSpans().filter(named("tools/call save", SpanKind.CLIENT));
  assert.equal(spans.length, 2);
  for (const span of spans) assert.equal(span.attributes["error.type"], undefined);
});

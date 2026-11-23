import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { request, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { actAs } from "holon-sh/context";
import { bindApps, createApps } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { load, serve, type App } from "holon-sh/serve";
import { serve as serveMcp, temporary } from "./helpers.ts";

const repository = dirname(import.meta.dirname);

// Sends a path as written, where fetch would resolve its dots first.
async function get(origin: string, path: string, method = "GET") {
  const response = await new Promise<IncomingMessage>(resolve => request(origin, { path, method }, resolve).end());
  let body = "";
  for await (const chunk of response) body += chunk;
  const { "content-type": type, "x-content-type-options": sniffing } = response.headers;
  return { status: response.statusCode, type, sniffing, body };
}

async function start(t: TestContext, app: App, variables: Record<string, string> = {}) {
  const saved = process.env;
  process.env = { ...saved, PORT: "0", ...variables };
  const server = await serve(app).finally(() => { process.env = saved; });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

function environment(t: TestContext, variables: Record<string, string>) {
  const saved = process.env;
  process.env = { ...saved, ...variables };
  t.after(() => { process.env = saved; });
}

const context = (claims: object) => `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

async function call(origin: string, name: string, headers: Record<string, string> = {}) {
  const fetchWith: typeof fetch = (input, init) => fetch(input, { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), ...headers } });
  const { app } = bindApps({ name: "test", version: "1.0.0" }, { app: null }, { app: { endpoint: `${origin}/mcp`, scoped: true, fetch: fetchWith, authProvider: { token: async () => "client-secret" } } });
  const [content] = (await app!.callTool({ name, arguments: {} }) as CompleteResult<unknown>).content;
  return content?.type === "text" ? JSON.parse(content.text) : undefined;
}

test("serve runs an app without Holon: its MCP endpoint and its page", { timeout: 10000 }, async t => {
  const root = temporary(t);
  mkdirSync(join(root, "web"));
  const files = [["web/index.html", "<p>page</p>"], ["web/app.mjs", "page()"], ["web/data", "bytes"], ["web/.env", "hidden"], ["secret", "outside"]];
  for (const [name, text] of files) writeFileSync(join(root, name!), text!);
  symlinkSync(join(root, "secret"), join(root, "web/escape"));
  // At /mcp/idle, the app answers with a stream that sends one event and then waits.
  let idle!: Request;
  let cancelled!: () => void;
  const left = new Promise<void>(resolve => (cancelled = resolve));
  const fetch = (request: Request) => {
    if (new URL(request.url).pathname !== "/mcp/idle") return Promise.resolve(new Response(null, { status: 202 }));
    idle = request;
    const event = new TextEncoder().encode("data: {}\n\n");
    return Promise.resolve(new Response(new ReadableStream({ start: stream => stream.enqueue(event), cancel: cancelled })));
  };
  const origin = await start(t, { default: { fetch }, frontend: pathToFileURL(join(root, "web/")) });

  assert.equal((await globalThis.fetch(`${origin}/mcp`, { method: "POST" })).status, 202);

  // A stream between events ends as soon as its client leaves, and the app hears that it left.
  const listening = request(`${origin}/mcp/idle`, { method: "POST" }).end();
  await once(listening, "response");
  assert.equal(new URL(idle.url).origin, origin);
  listening.destroy();
  await Promise.all([left, idle.signal.aborted || once(idle.signal, "abort")]);

  const page = { status: 200, sniffing: "nosniff" };
  assert.deepEqual(await get(origin, "/app.mjs", "HEAD"), { ...page, type: "text/javascript; charset=utf-8", body: "" });
  assert.deepEqual(await get(origin, "/data"), { ...page, type: "application/octet-stream", body: "bytes" });
  const missing = [["/", "POST"], ["/missing"], ["/.env"], ["/%2Eenv"], ["/escape"]];
  for (const [path, method] of missing) assert.equal((await get(origin, path!, method)).status, 404, `${method ?? "GET"} ${path}`);

  // A directory named without its trailing slash is still the directory, and not its parent.
  const unslashed = await start(t, { default: { fetch }, frontend: pathToFileURL(join(root, "web")) });
  assert.equal((await get(unslashed, "/")).body, "<p>page</p>");
});

test("inside Holon a tool reads its caller from the waypoint's headers, elsewhere every request is anonymous, and the app sees none of them", { timeout: 10000 }, async t => {
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("inspect", {}, ctx => ({ content: [{ type: "text", text: JSON.stringify({
      authInfo: ctx.http?.authInfo ?? null,
      headers: [...ctx.http!.req!.headers.keys()],
    }) }] }));
    return server;
  });
  const inside = await start(t, { default: handler }, { HOLON_PLATFORM: "1" });
  const outside = await start(t, { default: handler });

  const claims = { email: "alice@example.com", email_verified: true };
  const principal = { iss: "https://issuer.example", sub: "alice", client_id: "web", scope: " read  write ", claims, act: { sub: "agent" } };
  const signedIn = context({ principal });
  const signedOut = context({});
  const caller = { app: "reporter", session: "session" };
  const sent = { "x-holon-context": signedIn, "x-holon-caller": "session/reporter" };
  for (const [origin, headers, authInfo] of [
    [inside, sent, { token: signedIn, clientId: "web", scopes: ["read", "write"], extra: { iss: "https://issuer.example", sub: "alice", claims, act: { sub: "agent" }, caller } }],
    [inside, { ...sent, "x-holon-context": signedOut }, { token: signedOut, clientId: "", scopes: [], extra: { caller } }],
    [inside, {}, null],
    [outside, sent, null],
  ] as const) {
    const observed = await call(origin, "inspect", { ...headers, "x-holon-other": "forged" });
    assert.deepEqual(observed.authInfo, authInfo, JSON.stringify(headers));
    assert.deepEqual(observed.headers.filter((name: string) => name === "authorization" || name.startsWith("x-holon-")), []);
  }

  const large = context({ principal: { ...principal, sub: "s".repeat(12288) } });
  assert.equal((await call(inside, "inspect", { "x-holon-context": large })).authInfo.token, large);
});

test("a malformed Holon context is a bad request", { timeout: 10000 }, async t => {
  const origin = await start(t, { default: { fetch: async () => new Response() } }, { HOLON_PLATFORM: "1" });
  const token = (payload: string) => `e30.${Buffer.from(payload).toString("base64url")}.signature`;
  const caller = "session/reporter";
  for (const headers of [
    ["x-holon-context", context({}), "x-holon-context", context({})],
    ["x-holon-caller", caller, "x-holon-caller", caller],
    ["x-holon-caller", "reporter"],
    ["x-holon-context", "e30.e30=.signature"],
    ["x-holon-context", token("person")],
    ["x-holon-context", token("[]")],
    ["x-holon-context", context({ principal: 1 })],
    ["x-holon-context", context({ principal: { iss: 1 } })],
    ["x-holon-context", context({ principal: { claims: [] } })],
  ]) {
    const response = await new Promise<IncomingMessage>((resolve, reject) =>
      request(`${origin}/mcp`, { method: "POST", headers: ["host", new URL(origin).host, ...headers] }, resolve).on("error", reject).end("{}"));
    let body = "";
    for await (const chunk of response) body += chunk;
    assert.deepEqual([response.statusCode, body], [400, "Malformed Holon context\n"], JSON.stringify(headers));
  }
});

test("an environment-bound dependency acts for a delegated person or the caller until its request ends, and an explicit binding never does", { timeout: 10000 }, async t => {
  const sent: string[] = [];
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("ping", {}, () => ({ content: [] }));
    return server;
  }, req => sent.push(`${req.headers["x-holon-act-as"]} ${req.headers["x-holon-context"]} ${req.headers.authorization}`));
  const received = () => [...new Set(sent.splice(0))];
  environment(t, { PEER_MCP_URL: peer.endpoint, PEER_MCP_TOKEN: "peer-secret" });
  const identity = { name: "app", version: "1.0.0", requires: { peer: {} } };
  const peers = createApps(identity, {});
  const ping = (apps = peers) => apps.peer!.callTool({ name: "ping", arguments: {} });

  await actAs("ann", ping);
  assert.deepEqual(received(), ["ann undefined Bearer peer-secret"]);
  await ping();
  assert.deepEqual(received(), ["undefined undefined Bearer peer-secret"]);
  assert.throws(() => actAs("", ping), TypeError);

  let release!: () => void;
  const released = new Promise<void>(resolve => (release = resolve));
  const phases: string[][] = [];
  let late!: Promise<unknown>;
  const mcp = createMcpHandler(() => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("relay", {}, async () => {
      await actAs("bob", ping);
      phases.push(received());
      await ping();
      phases.push(received());
      await actAs("bob", () => ping(bindApps(identity, {}, { peer: { endpoint: peer.endpoint, scoped: true } })));
      phases.push(received());
      late = released.then(() => ping());
      return { content: [] };
    });
    return server;
  });
  const fetch: App["default"]["fetch"] = async (request, options) => {
    if (new URL(request.url).pathname !== "/mcp/stream") return mcp.fetch(request, options);
    const chunks = ["first", "second"];
    return new Response(new ReadableStream({
      async pull(stream) {
        const chunk = chunks.shift();
        if (chunk === "second") await ping();
        if (chunk) stream.enqueue(new TextEncoder().encode(chunk));
        else stream.close();
      },
    }));
  };
  const origin = await start(t, { default: { fetch } }, { HOLON_PLATFORM: "1" });
  const token = context({ principal: { iss: "https://issuer.example", sub: "alice", client_id: "web" } });

  await call(origin, "relay", { "x-holon-context": token });
  assert.deepEqual(phases, [["bob undefined Bearer peer-secret"], [`undefined ${token} Bearer peer-secret`], ["undefined undefined undefined"]]);
  release();
  await late;
  assert.deepEqual(received(), ["undefined undefined Bearer peer-secret"]);

  const streamed = await globalThis.fetch(`${origin}/mcp/stream`, { method: "POST", headers: { "x-holon-context": token } });
  assert.equal(await streamed.text(), "firstsecond");
  assert.deepEqual(received(), [`undefined ${token} Bearer peer-secret`]);
});

test("holon-serve runs an app's module until SIGTERM, when it closes its event streams with their final frame and exits whatever the app left running, and load takes only a module serve can run", { timeout: 10000 }, async t => {
  const root = temporary(t);
  writeFileSync(join(root, "plain.mjs"), "export default {};");
  writeFileSync(join(root, "named.mjs"), "export default { fetch() {} }; export const frontend = 'web';");
  await assert.rejects(load(join(root, "plain.mjs")), /plain\.mjs must default-export an MCP handler/);
  await assert.rejects(load(join(root, "named.mjs")), /named\.mjs must export frontend as a file URL/);

  const { bin } = JSON.parse(readFileSync(join(repository, "packages/node/package.json"), "utf8"));
  const fixture = JSON.stringify(new URL("./fixtures/app.ts", import.meta.url).href);
  writeFileSync(join(root, "busy.mjs"), `export * from ${fixture}; export { default } from ${fixture}; setInterval(() => {}, 1000);`);
  const child = spawn(process.execPath, [join(repository, "packages/node", bin["holon-serve"]), join(root, "busy.mjs")], { env: { ...process.env, PORT: "0" } });
  t.after(() => child.kill("SIGKILL"));
  const exited = once(child, "exit");
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const origin = /http:\/\/[^/]+/.exec((await lines.next()).value)![0];
  assert.equal((await get(origin, "/")).body, "<p>fixture</p>");
  const client = new Client({ name: "test", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`)));
  t.after(() => client.close());
  const active = new Promise<void>(resolve => client.setNotificationHandler("notifications/events/active", { params: z.any() }, () => resolve()));
  const stream = client.request({ method: "events/stream", params: { name: "ticked", arguments: {} } }, z.any()).then(() => "closed", () => "dropped");
  await active;
  child.kill("SIGTERM");
  assert.deepEqual(await exited, [0, null]);
  assert.equal(await stream, "closed");
});

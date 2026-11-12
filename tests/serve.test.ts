import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { request, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { bindApps, createApps } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { getContext } from "holon-sh/context";
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

// serve reads the environment as it starts.
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

// The waypoint checked the signature, so the SDK reads only the claims.
const context = (claims: object) => `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

// Calls a tool with the headers Holon's waypoint would set, and the client's own authorization.
async function call(origin: string, name: string, headers: Record<string, string> = {}) {
  const fetchWith: typeof fetch = (input, init) => fetch(input, { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), ...headers } });
  const { app } = bindApps({ name: "test", version: "1.0.0" }, { app: null }, { app: { endpoint: `${origin}/mcp`, scoped: true, fetch: fetchWith, authProvider: { token: async () => "client-secret" } } });
  const [content] = (await app!.callTool({ name, arguments: {} }) as CompleteResult<unknown>).content;
  return content?.type === "text" ? JSON.parse(content.text) : undefined;
}

test("serve runs an app without Holon: its MCP endpoint for clients of every version, and its page", { timeout: 10000 }, async t => {
  const root = temporary(t);
  for (const directory of ["web", "web/docs", "web/empty", "outside"]) mkdirSync(join(root, directory));
  const files = [["web/index.html", "<p>page</p>"], ["web/app.mjs", "page()"], ["web/data", "bytes"], ["web/.env", "hidden"], ["web/docs/index.html", "<p>docs</p>"], ["secret", "outside"], ["outside/index.html", "outside"]];
  for (const [name, text] of files) writeFileSync(join(root, name!), text!);
  // A link may name a file in the directory, but leads nowhere outside it.
  symlinkSync(join(root, "web/app.mjs"), join(root, "web/linked.mjs"));
  symlinkSync(join(root, "secret"), join(root, "web/escape"));
  symlinkSync(join(root, "outside"), join(root, "web/away"));
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
  const origin = await start(t, { default: { fetch }, frontend: pathToFileURL(join(root, "web/")) });

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
  const html = { ...page, type: "text/html; charset=utf-8" };
  assert.deepEqual(await get(origin, "/"), { ...html, body: "<p>page</p>" });
  assert.deepEqual(await get(origin, "/app.mjs", "HEAD"), { ...page, type: "text/javascript; charset=utf-8", body: "" });
  assert.deepEqual(await get(origin, "/data"), { ...page, type: "application/octet-stream", body: "bytes" });
  assert.deepEqual(await get(origin, "/linked.mjs"), { ...page, type: "text/javascript; charset=utf-8", body: "page()" });
  for (const path of ["/docs", "/docs/"]) assert.deepEqual(await get(origin, path), { ...html, body: "<p>docs</p>" }, path);
  const missing = [["/", "POST"], ["/missing"], ["/empty/"], ["/.env"], ["/%2Eenv"], ["/../secret"], ["/%2e%2e/secret"], ["/..%2fsecret"], ["/%2fdata"], ["/escape"], ["/away/"], ["/away/index.html"]];
  for (const [path, method] of missing) assert.equal((await get(origin, path!, method)).status, 404, `${method ?? "GET"} ${path}`);
  assert.equal((await get(await start(t, { default: { fetch } }), "/")).status, 404, "an app without a page has none");

  // A directory named without its trailing slash is still the directory, and not its parent.
  const unslashed = await start(t, { default: { fetch }, frontend: pathToFileURL(join(root, "web")) });
  assert.deepEqual([(await get(unslashed, "/")).body, (await get(unslashed, "/secret")).status], ["<p>page</p>", 404]);
});

test("inside Holon a tool reads its caller from the waypoint's headers, elsewhere every request is anonymous, and the app sees none of them", { timeout: 10000 }, async t => {
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("inspect", {}, ctx => ({ content: [{ type: "text", text: JSON.stringify({
      authInfo: ctx.http?.authInfo ?? null,
      principal: getContext(ctx.http).principal,
      headers: [...ctx.http!.req!.headers.keys()],
    }) }] }));
    return server;
  });
  const inside = await start(t, { default: handler }, { HOLON_PLATFORM: "1" });
  const outside = await start(t, { default: handler });

  const claims = { email: "alice@example.com", email_verified: true };
  const principal = { iss: "https://issuer.example", sub: "alice", client_id: "web", scope: " read  write ", claims, act: { sub: "agent" } };
  const audience = { exp: 1900000060.25, aud: ["https://holon.example"], flowId: "flow" };
  const signedIn = context({ ...audience, principal });
  const signedOut = context({ ...audience, aud: "https://holon.example" });
  const hook = context({ ...audience, hook: { app: "accounts", job: "install-accounts" } });
  const mesh = (app: string) => `spiffe://cluster.local/ns/session/sa/${app}`;
  const reporter = { app: "reporter", session: "session" };
  const user = { issuer: "https://issuer.example", subject: "alice", clientId: "web", scopes: ["read", "write"], claims, actor: { sub: "agent" } };
  const admitted = { token: signedIn, clientId: "web", scopes: ["read", "write"] };
  const asUser = { iss: "https://issuer.example", sub: "alice", claims, act: { sub: "agent" } };
  const app = { token: "", clientId: "", scopes: [] };
  const anonymous = app;
  for (const [origin, headers, authInfo, expected] of [
    [inside, { "x-holon-context": signedIn }, { ...admitted, extra: asUser }, user],
    [inside, { "x-holon-context": signedIn, "x-holon-caller": mesh("reporter") }, { ...admitted, extra: { ...asUser, caller: reporter } }, user],
    [inside, { "x-holon-caller": mesh("reporter") }, { ...app, extra: { caller: reporter } }, null],
    [inside, { "x-holon-context": signedOut, "x-holon-caller": mesh("reporter") }, { ...anonymous, token: signedOut, extra: { caller: reporter } }, null],
    // The waypoint names a lifecycle hook's job as the app whose hook it runs.
    [inside, { "x-holon-context": hook, "x-holon-caller": mesh("accounts") }, { ...anonymous, token: hook, extra: { caller: { app: "accounts", session: "session" } } }, null],
    [inside, { "x-holon-context": signedOut }, null, null],
    [inside, {}, null, null],
    [outside, { "x-holon-context": signedIn, "x-holon-caller": mesh("reporter") }, null, null],
  ] as const) {
    const observed = await call(origin, "inspect", { ...headers, "x-holon-other": "forged" });
    assert.deepEqual([observed.authInfo, observed.principal], [authInfo, expected], JSON.stringify(headers));
    assert.deepEqual(observed.headers.filter((name: string) => name === "authorization" || name.startsWith("x-holon-")), []);
  }

  // A context is up to 16 KiB, as much as Node takes in all of a request's headers by default.
  const large = context({ ...audience, principal: { ...principal, sub: "s".repeat(12288) } });
  assert.ok(large.length > 16384);
  assert.equal((await call(inside, "inspect", { "x-holon-context": large })).authInfo.token, large);
});

test("a malformed Holon context is a bad request", { timeout: 10000 }, async t => {
  let reached = 0;
  const handler = createMcpHandler(() => {
    reached++;
    return new McpServer({ name: "app", version: "1.0.0" });
  });
  const origin = await start(t, { default: handler }, { HOLON_PLATFORM: "1" });
  const person = { iss: "https://issuer.example", sub: "alice", client_id: "web", act: { sub: "agent" } };
  const token = (payload: string) => `e30.${Buffer.from(payload).toString("base64url")}.signature`;
  const caller = "spiffe://cluster.local/ns/session/sa/reporter";
  for (const headers of [
    ["x-holon-context", context({}), "x-holon-context", context({})],
    ["x-holon-caller", caller, "x-holon-caller", caller],
    ["x-holon-caller", "spiffe://holon.example/sa/reporter"],
    ["x-holon-context", "header.claims"],
    ["x-holon-context", "e30.e30=.signature"],
    ["x-holon-context", token("person")],
    ["x-holon-context", token("[]")],
    ["x-holon-context", token("null")],
    ["x-holon-context", context({ principal: "user" })],
    ["x-holon-context", context({ principal: { iss: 1 } })],
    ["x-holon-context", context({ principal: { claims: [] } })],
    ["x-holon-context", context({ principal: { ...person, act: ["agent"] } })],
  ]) {
    const response = await new Promise<IncomingMessage>((resolve, reject) =>
      // Headers given as a list carry no Host of their own, which HTTP/1.1 requires.
      request(`${origin}/mcp`, { method: "POST", headers: ["host", new URL(origin).host, ...headers] }, resolve).on("error", reject).end("{}"));
    let body = "";
    for await (const chunk of response) body += chunk;
    assert.deepEqual([response.statusCode, body], [400, "Malformed Holon context\n"], JSON.stringify(headers));
  }
  assert.equal(reached, 0);
});

test("a dependency bound by the environment acts for the caller until its request ends, and an explicit binding never does", { timeout: 10000 }, async t => {
  const sent: string[] = [];
  const peer = await serveMcp(t, () => {
    const server = new McpServer({ name: "peer", version: "1.0.0" });
    server.registerTool("ping", {}, () => ({ content: [] }));
    return server;
  }, req => sent.push(`${req.headers["x-holon-context"]} ${req.headers.authorization}`));
  const received = () => [...new Set(sent.splice(0))];
  environment(t, { PEER_MCP_URL: peer.endpoint, PEER_MCP_TOKEN: "peer-secret" });
  const identity = { name: "app", version: "1.0.0", requires: { peer: {} } };
  const ping = (apps: ReturnType<typeof createApps>) => apps.peer!.callTool({ name: "ping", arguments: {} });

  let release!: () => void;
  const released = new Promise<void>(resolve => (release = resolve));
  const phases: string[][] = [];
  let late!: Promise<unknown>;
  const mcp = createMcpHandler(() => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("relay", {}, async () => {
      await ping(createApps(identity, {}));
      phases.push(received());
      await ping(bindApps(identity, {}, { peer: { endpoint: peer.endpoint, scoped: true } }));
      phases.push(received());
      // A task the tool leaves running calls after the request ended.
      late = released.then(() => ping(createApps(identity, {})));
      return { content: [] };
    });
    return server;
  });
  // At /mcp/stream, the app calls the peer for the second chunk of its body, which serve reads after the handler returned.
  const fetch: App["default"]["fetch"] = async (request, options) => {
    if (new URL(request.url).pathname !== "/mcp/stream") return mcp.fetch(request, options);
    const chunks = ["first", "second"];
    return new Response(new ReadableStream({
      async pull(stream) {
        const chunk = chunks.shift();
        if (chunk === "second") await ping(createApps(identity, {}));
        if (chunk) stream.enqueue(new TextEncoder().encode(chunk));
        else stream.close();
      },
    }));
  };
  const origin = await start(t, { default: { fetch } }, { HOLON_PLATFORM: "1" });
  const token = context({ exp: 1900000060.25, aud: ["https://holon.example"], principal: { iss: "https://issuer.example", sub: "alice", client_id: "web" } });

  await call(origin, "relay", { "x-holon-context": token });
  assert.deepEqual(phases, [[`${token} Bearer peer-secret`], ["undefined undefined"]]);
  release();
  await late;
  assert.deepEqual(received(), ["undefined Bearer peer-secret"]);

  const streamed = await globalThis.fetch(`${origin}/mcp/stream`, { method: "POST", headers: { "x-holon-context": token } });
  assert.equal(await streamed.text(), "firstsecond");
  assert.deepEqual(received(), [`${token} Bearer peer-secret`]);
});

test("holon-serve runs an app's module until SIGTERM, and load takes only a module serve can run", { timeout: 10000 }, async t => {
  const root = temporary(t);
  writeFileSync(join(root, "plain.mjs"), "export default {};");
  writeFileSync(join(root, "named.mjs"), "export default { fetch() {} }; export const frontend = 'web';");
  await assert.rejects(load(join(root, "plain.mjs")), /plain\.mjs must default-export an MCP handler/);
  await assert.rejects(load(join(root, "named.mjs")), /named\.mjs must export frontend as a file URL/);
  // An entry is relative to the working directory.
  const entry = relative(process.cwd(), join(repository, "tests/fixtures/app.ts"));
  assert.equal((await load(entry)).frontend?.href, new URL("./fixtures/web/", import.meta.url).href);

  const { bin } = JSON.parse(readFileSync(join(repository, "packages/node/package.json"), "utf8"));
  const child = spawn(process.execPath, [join(repository, "packages/node", bin["holon-serve"]), entry], { env: { ...process.env, PORT: "0" } });
  t.after(() => child.kill("SIGKILL"));
  const exited = once(child, "exit");
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
  const origin = /http:\/\/[^/]+/.exec((await lines.next()).value)![0];
  assert.equal((await get(origin, "/")).body, "<p>fixture</p>");
  const { app } = createApps({ name: "test", version: "1.0.0" }, { app: null }, { app: { endpoint: `${origin}/mcp` } });
  t.after(() => app!.close());
  assert.deepEqual((await app!.callTool({ name: "hello", arguments: {} })).content, [{ type: "text", text: "hello" }]);
  // A call in flight ends with the server, which then exits by itself.
  const waiting = app!.callTool({ name: "wait", arguments: {} }).then(() => "answered", () => "ended");
  assert.equal((await lines.next()).value, "waiting");
  child.kill("SIGTERM");
  assert.deepEqual(await exited, [0, null]);
  assert.equal(await waiting, "ended");
});

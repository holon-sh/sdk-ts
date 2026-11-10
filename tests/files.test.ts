import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { acceptedContent, createMcpHandler, fromJsonSchema, inputRequired, McpServer, type CallToolResult, type InputRequiredResult, type JSONObject } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { createApps, type Binding, type ToolCallOptions } from "holon-sh/runtime";
import type { CompleteResult } from "holon-sh/protocol";
import { EXTENSION } from "holon-sh/ext/files";
const fileInput = { type: "object", "x-mcp-file": { maxSize: 64 }, properties: { id: { type: "string" }, name: { type: "string" }, mimeType: { type: "string" }, size: { type: "integer" }, digest: { type: "object" }, data: { type: "string" } }, required: ["id", "mimeType", "size"] };
const schema = {
  type: "object",
  properties: { file: { $ref: "#/$defs/file" }, more: { type: "array", items: { anyOf: [{ type: "string" }, { $ref: "#/$defs/file" }] } }, checked: { ...fileInput, required: [...fileInput.required, "digest"] } },
  $defs: { file: fileInput },
};

interface FileArgument { id: string }
interface Call { args: { file: FileArgument; more: FileArgument[] }; requestState?: string; inputResponses?: Record<string, unknown> }
interface Stored { method?: string; url?: string; headers: IncomingHttpHeaders; body: string }
type Reply = CallToolResult | InputRequiredResult;

async function files(t: TestContext, { settings, tool, storage = () => [200] }: { settings: JSONObject; tool: (call: Call) => Reply; storage?: (entry: Stored) => [number, string?] }) {
  const calls: Call[] = [];
  const stored: Stored[] = [];
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "files", version: "1" }, { capabilities: { extensions: { [EXTENSION]: settings } } });
    server.registerTool("save", { inputSchema: fromJsonSchema(schema) }, async (args, ctx) => {
      const call = { args: args as Call["args"], requestState: ctx.mcpReq.requestState() as string | undefined, inputResponses: ctx.mcpReq.inputResponses };
      calls.push(call);
      return tool(call);
    });
    return server;
  }, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (req.url !== "/mcp") {
      const entry = { method: req.method, url: req.url, headers: req.headers, body: body.toString() };
      stored.push(entry);
      const [status, reply] = storage(entry);
      return void res.writeHead(status).end(reply);
    }
    const message = body.length ? JSON.parse(body.toString()) : undefined;
    if (message?.params?.requestState === "lost") return void res.destroy();
    void dispatch(req, res, message).catch(() => res.destroy());
  });
  t.after(async () => {
    await handler.close();
    http.closeAllConnections();
    await http[Symbol.asyncDispose]();
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  const app = (binding?: Partial<Binding>) => {
    const { files: client } = createApps({ name: "script", version: "1" }, { files: { tools: [{ name: "save", inputSchema: schema }] } }, { files: { endpoint: `${origin}/mcp`, fileOrigins: [origin], authProvider: { token: async () => "secret" }, ...binding } });
    t.after(() => client.close());
    return { save: async (input: Record<string, unknown>, options?: ToolCallOptions) => await client.tools.save(input, options) as CompleteResult<unknown> };
  };
  return { origin, calls, stored, app };
}

const text = (value: unknown): CallToolResult => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] });
const textOf = (result: CompleteResult<unknown>) => (result.content[0] as { text: string }).text;
const uploadRequired = (uploads: object[], requestState = "state") => ({ resultType: "upload_required", content: [], uploads, requestState }) as unknown as Reply;
const sha256 = (value: string) => createHash("sha256").update(value).digest("base64url");

test("small files travel inline with their digest when the schema requires it, and files the server cannot take never leave", { timeout: 10000 }, async t => {
  const server = await files(t, { settings: { maxInlineBytes: 8 }, tool: ({ args }) => text(args) });
  const app = server.app();
  const result = await app.save({ checked: new File(["hello"], "dir\\a.txt", { type: "text/plain" }), more: ["note", new Blob([])] });
  const { checked, more } = JSON.parse(textOf(result));
  assert.deepEqual({ ...checked, id: typeof checked.id }, { id: "string", name: "a.txt", mimeType: "text/plain", size: 5, digest: { algorithm: "sha-256", value: sha256("hello") }, data: Buffer.from("hello").toString("base64") });
  assert.deepEqual({ ...more[1], id: typeof more[1].id }, { id: "string", mimeType: "application/octet-stream", size: 0 });
  await assert.rejects(app.save({ file: new Blob(["123456789"]) }), /cannot receive a file \(9 bytes\).*the tool was not called/);
  await assert.rejects(app.save({ file: new Blob([new Uint8Array(65)]) }), /over the tool's limit of 64; the tool was not called/);
  await assert.rejects(app.save({ more: [{ nested: new Blob(["x"]) }] }), /Blob at \/more\/0\/nested is not a file argument/);
  assert.equal(server.calls.length, 1);
});

test("out-of-band files go to a url target without credentials and a path target with the MCP credential, then the call is retried", { timeout: 10000 }, async t => {
  const server = await files(t, {
    settings: { upload: {} },
    tool: ({ args, requestState }) => requestState === "state"
      ? text("saved")
      : uploadRequired([
        { fileId: args.file.id, url: `${server.origin}/storage/a?sig=x`, headers: { "Content-Type": "text/plain" }, credentials: "omit" },
        { fileId: args.more[0].id, path: "/uploads/b", credentials: "include", _meta: { ignored: true } },
      ]),
  });
  const result = await server.app().save({ file: new File(["alpha"], "a.txt", { type: "text/plain" }), more: [new Blob(["beta!"], { type: "application/x-beta" })] });
  assert.equal(textOf(result), "saved");
  const transfers = server.stored.map(({ method, url, headers, body }) => [method, url, body, headers["content-type"], headers["content-length"], headers.authorization]).sort();
  assert.deepEqual(transfers, [["PUT", "/mcp/uploads/b", "beta!", undefined, "5", "Bearer secret"], ["PUT", "/storage/a?sig=x", "alpha", "text/plain", "5", undefined]]);
  assert.equal(server.calls.length, 2);
  assert.deepEqual(server.calls[1].args, server.calls[0].args);
});

test("a form target gets the fields in order and the file last, under a 128-bit boundary and an escaped base name", { timeout: 10000 }, async t => {
  const form = { fields: [{ name: "key", value: "staging/1" }, { name: "policy", value: "p" }], fileField: "file" };
  const server = await files(t, {
    settings: { upload: {} },
    tool: ({ args, requestState }) => requestState ? text("saved") : uploadRequired([{ fileId: args.file.id, url: `${server.origin}/form`, method: "POST", form, credentials: "omit" }]),
  });
  await server.app().save({ file: new File(["form body"], 'C:\\dir\\q"uote\r\n.txt', { type: "text/plain;charset=utf-8" }) });
  const [{ method, headers, body }] = server.stored;
  const boundary = /^multipart\/form-data; boundary=(.*)$/.exec(headers["content-type"] ?? "")?.[1] ?? "";
  assert.match(boundary, /[0-9a-f]{32}$/);
  assert.equal(method, "POST");
  assert.equal(headers["content-length"], String(Buffer.byteLength(body)));
  const part = (disposition: string, value: string) => `--${boundary}\r\nContent-Disposition: form-data; ${disposition}\r\n\r\n${value}\r\n`;
  assert.equal(body, part('name="key"', "staging/1") + part('name="policy"', "p") + part('name="file"; filename="q%22uote%0D%0A.txt"\r\nContent-Type: text/plain;charset=utf-8', "form body") + `--${boundary}--\r\n`);
});

test("a rejected target or an unreachable address leaves the tool not run and nothing transferred", { timeout: 10000 }, async t => {
  let target: object = {};
  const server = await files(t, { settings: { upload: {} }, tool: ({ args }) => uploadRequired([{ fileId: args.file.id, credentials: "omit", ...target }]) });
  const allowlisted = server.app();
  const open = server.app({ fileOrigins: undefined });
  const cases: Array<[typeof open, object, RegExp]> = [
    [allowlisted, { url: "https://storage.example/u" }, /rejected \(url is not on fileOrigins\)/],
    [allowlisted, { path: "/u", headers: { Authorization: "Bearer stolen" } }, /rejected \(header Authorization is not allowed\)/],
    [allowlisted, { path: "/u/../mcp" }, /rejected \(path is not a valid path\)/],
    [open, { url: `${server.origin}/u` }, /rejected \(url is not https\)/],
    [open, { url: "https://localhost:4433/u" }, /failed \(the host has no globally reachable address\)/],
    [open, { url: "https://[::ffff:127.0.0.1]:4433/u" }, /failed \(the address is not globally reachable\)/],
  ];
  for (const [app, value, message] of cases) {
    target = value;
    await assert.rejects(app.save({ file: new Blob(["x"]) }), (error: Error) => message.test(error.message) && /; the tool did not run\.$/.test(error.message) && !error.message.includes("stolen"));
  }
  assert.equal(server.calls.length, cases.length);
  assert.deepEqual(server.stored, []);
});

test("a failed PUT is tried three times and a failed POST once, and the call is not retried", { timeout: 10000 }, async t => {
  let target: object = {};
  const server = await files(t, { settings: { upload: {} }, storage: () => [503], tool: ({ args }) => uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit", ...target }]) });
  const app = server.app();
  for (const value of [{}, { method: "POST" }]) {
    target = value;
    await assert.rejects(app.save({ file: new Blob(["x"]) }), { message: "files.save: uploading a file failed (HTTP 503); the tool did not run." });
  }
  assert.deepEqual(server.stored.map(({ method }) => method), ["PUT", "PUT", "PUT", "POST"]);
  assert.equal(server.calls.length, 2);
});

test("a second upload request fails the call without a transfer, and a retry without a response has an unknown outcome", { timeout: 10000 }, async t => {
  let state = "again";
  const server = await files(t, { settings: { upload: {} }, tool: ({ args }) => uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit" }], state) });
  const app = server.app();
  await assert.rejects(app.save({ file: new Blob(["x"]) }), { message: "files.save: the server asked for a second upload; the tool did not run." });
  assert.deepEqual([server.stored.length, server.calls.length], [1, 2]);
  state = "lost";
  await assert.rejects(app.save({ file: new Blob(["x"]) }), /^Error: files\.save: the outcome is unknown; the tool may have run/);
  assert.deepEqual([server.stored.length, server.calls.length], [2, 3]);
});

test("questions before and after an upload are answered, and the retry that answers the upload does not repeat them", { timeout: 10000 }, async t => {
  const answer = z.object({ value: z.string() });
  const ask = (key: string, requestState: string) => inputRequired({ inputRequests: { [key]: inputRequired.elicit({ message: key, requestedSchema: answer }) }, requestState });
  const server = await files(t, {
    settings: { upload: {} },
    tool: ({ args, requestState, inputResponses }) => {
      if (!requestState) return ask("folder", "asked");
      if (requestState === "asked") return uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit" }], `uploading:${acceptedContent(inputResponses, "folder", answer)?.value}`);
      if (requestState.startsWith("uploading:")) return ask("confirm", `confirm:${requestState.slice(10)}`);
      return text(`saved to ${requestState.slice(8)} after ${acceptedContent(inputResponses, "confirm", answer)?.value}`);
    },
  });
  const asked: string[] = [];
  const result = await server.app().save({ file: new Blob(["x"]) }, { elicit: ({ message }) => { asked.push(message); return { action: "accept", content: { value: message === "folder" ? "inbox" : "yes" } }; } });
  assert.equal(textOf(result), "saved to inbox after yes");
  assert.deepEqual(asked, ["folder", "confirm"]);
  assert.equal(server.stored.length, 1);
  assert.deepEqual(server.calls.map(({ inputResponses }) => Object.keys(inputResponses ?? {})), [[], ["folder"], [], ["confirm"]]);
});

test("downloads are fetched through handles that check size and digest, and their targets leave the result", { timeout: 10000 }, async t => {
  const target = (name: string, size: number, digest?: string) => ({ name, mimeType: "text/csv", size, ...(digest && { digest: { algorithm: "sha-256", value: digest } }), url: `${server.origin}/d/${name}?sig=x`, credentials: "omit" });
  const server = await files(t, {
    settings: {},
    storage: () => [200, "a,b\n1,2"],
    tool: () => ({ ...text("Exported."), _meta: { [EXTENSION]: { downloads: [target("good.csv", 7, sha256("a,b\n1,2")), target("long.csv", 6), target("forged.csv", 7, sha256("other"))] }, kept: true } }),
  });
  const result = await server.app().save({});
  assert.deepEqual([EXTENSION in (result._meta ?? {}), result._meta?.kept], [false, true]);
  const [good, long, forged] = result.downloads ?? [];
  assert.deepEqual(result.downloads?.map(({ name, size }) => [name, size]), [["good.csv", 7], ["long.csv", 6], ["forged.csv", 7]]);
  const blob = await good.blob();
  assert.deepEqual([await blob.text(), blob.type], ["a,b\n1,2", "text/csv"]);
  await assert.rejects(long.blob(), { message: 'Downloading "long.csv" failed (more than the declared 6 bytes; discarded).' });
  await assert.rejects(forged.blob(), { message: 'Downloading "forged.csv" failed (the bytes do not match the digest; discarded).' });
});

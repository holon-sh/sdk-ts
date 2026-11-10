import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { acceptedContent, createMcpHandler, fromJsonSchema, inputRequired, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";

const EXTENSION = "io.modelcontextprotocol/files";
const fileInput = { type: "object", "x-mcp-file": { maxSize: 64 }, properties: { id: { type: "string" }, name: { type: "string" }, mimeType: { type: "string" }, size: { type: "integer" }, digest: { type: "object" }, data: { type: "string" } }, required: ["id", "mimeType", "size"] };
const schema = {
  type: "object",
  properties: { file: { $ref: "#/$defs/file" }, more: { type: "array", items: { anyOf: [{ type: "string" }, { $ref: "#/$defs/file" }] } }, checked: { ...fileInput, required: [...fileInput.required, "digest"] } },
  $defs: { file: fileInput },
};

// One MCP server whose save tool answers through `tool`, and storage beside it that records each transfer and answers
// with `storage`. Every tools/call reaches `calls` before the tool runs.
async function files(t, { settings, tool, storage = () => [200] }) {
  const calls = [];
  const stored = [];
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "files", version: "1" }, { capabilities: { extensions: { [EXTENSION]: settings } } });
    server.registerTool("save", { inputSchema: fromJsonSchema(schema) }, async (args, ctx) => {
      const call = { args, requestState: ctx.mcpReq.requestState(), inputResponses: ctx.mcpReq.inputResponses };
      calls.push(call);
      return tool(call, ctx);
    });
    return server;
  }, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (req.url !== "/mcp") {
      const entry = { method: req.method, url: req.url, headers: req.headers, body: body.toString() };
      stored.push(entry);
      const [status, reply] = storage(entry);
      return void res.writeHead(status).end(reply);
    }
    const message = body.length ? JSON.parse(body) : undefined;
    // A retry whose response never arrives.
    if (message?.params?.requestState === "lost") return void res.destroy();
    void dispatch(req, res, message).catch(() => res.destroy());
  });
  t.after(async () => {
    await handler.close();
    http.closeAllConnections();
    await new Promise(resolve => http.close(resolve));
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const origin = `http://127.0.0.1:${http.address().port}`;
  const app = binding => {
    const { files: client } = createApps({ name: "script", version: "1" }, { files: { tools: [{ name: "save", inputSchema: schema }] } }, { files: { endpoint: `${origin}/mcp`, fileOrigins: [origin], authProvider: { token: async () => "secret" }, ...binding } });
    t.after(() => client.close());
    return client;
  };
  return { origin, calls, stored, app };
}

const text = value => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }] });
const uploadRequired = (uploads, requestState = "state") => ({ resultType: "upload_required", content: [], uploads, requestState });
const sha256 = value => createHash("sha256").update(value).digest("base64url");

test("small files travel inline with their digest when the schema requires it, and files the server cannot take never leave", { timeout: 10000 }, async t => {
  const server = await files(t, { settings: { maxInlineBytes: 8 }, tool: ({ args }) => text(args) });
  const app = server.app();
  const result = await app.tools.save({ checked: new File(["hello"], "dir\\a.txt", { type: "text/plain" }), more: ["note", new Blob([])] });
  const { checked, more } = JSON.parse(result.content[0].text);
  assert.deepEqual({ ...checked, id: typeof checked.id }, { id: "string", name: "a.txt", mimeType: "text/plain", size: 5, digest: { algorithm: "sha-256", value: sha256("hello") }, data: Buffer.from("hello").toString("base64") });
  assert.deepEqual({ ...more[1], id: typeof more[1].id }, { id: "string", mimeType: "application/octet-stream", size: 0 });
  await assert.rejects(app.tools.save({ file: new Blob(["123456789"]) }), /cannot receive a file \(9 bytes\).*the tool was not called/);
  await assert.rejects(app.tools.save({ file: new Blob([new Uint8Array(65)]) }), /over the tool's limit of 64; the tool was not called/);
  await assert.rejects(app.tools.save({ more: [{ nested: new Blob(["x"]) }] }), /Blob at \/more\/0\/nested is not a file argument/);
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
  const result = await server.app().tools.save({ file: new File(["alpha"], "a.txt", { type: "text/plain" }), more: [new Blob(["beta!"], { type: "application/x-beta" })] });
  assert.equal(result.content[0].text, "saved");
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
  await server.app().tools.save({ file: new File(["form body"], 'C:\\dir\\q"uote\r\n.txt', { type: "text/plain;charset=utf-8" }) });
  const [{ method, headers, body }] = server.stored;
  const boundary = /^multipart\/form-data; boundary=(.*)$/.exec(headers["content-type"])[1];
  assert.match(boundary, /[0-9a-f]{32}$/);
  assert.equal(method, "POST");
  assert.equal(headers["content-length"], String(Buffer.byteLength(body)));
  const part = (disposition, value) => `--${boundary}\r\nContent-Disposition: form-data; ${disposition}\r\n\r\n${value}\r\n`;
  assert.equal(body, part('name="key"', "staging/1") + part('name="policy"', "p") + part('name="file"; filename="q%22uote%0D%0A.txt"\r\nContent-Type: text/plain;charset=utf-8', "form body") + `--${boundary}--\r\n`);
});

test("a rejected target or an unreachable address leaves the tool not run and nothing transferred", { timeout: 10000 }, async t => {
  let target;
  const server = await files(t, { settings: { upload: {} }, tool: ({ args }) => uploadRequired([{ fileId: args.file.id, credentials: "omit", ...target }]) });
  const allowlisted = server.app();
  const open = server.app({ fileOrigins: undefined });
  const cases = [
    [allowlisted, { url: "https://storage.example/u" }, /rejected \(url is not on fileOrigins\)/],
    [allowlisted, { path: "/u", headers: { Authorization: "Bearer stolen" } }, /rejected \(header Authorization is not allowed\)/],
    [allowlisted, { path: "/u/../mcp" }, /rejected \(path is not a valid path\)/],
    [open, { url: `${server.origin}/u` }, /rejected \(url is not https\)/],
    [open, { url: "https://localhost:4433/u" }, /failed \(the host has no globally reachable address\)/],
    [open, { url: "https://[::ffff:127.0.0.1]:4433/u" }, /failed \(the address is not globally reachable\)/],
  ];
  for (const [app, value, message] of cases) {
    target = value;
    await assert.rejects(app.tools.save({ file: new Blob(["x"]) }), error => message.test(error.message) && /; the tool did not run\.$/.test(error.message) && !error.message.includes("stolen"));
  }
  assert.equal(server.calls.length, cases.length);
  assert.deepEqual(server.stored, []);
});

test("a failed PUT is tried three times and a failed POST once, and the call is not retried", { timeout: 10000 }, async t => {
  let target;
  const server = await files(t, { settings: { upload: {} }, storage: () => [503], tool: ({ args }) => uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit", ...target }]) });
  const app = server.app();
  for (const value of [{}, { method: "POST" }]) {
    target = value;
    await assert.rejects(app.tools.save({ file: new Blob(["x"]) }), { message: 'files.save: uploading a file failed (HTTP 503); the tool did not run.' });
  }
  assert.deepEqual(server.stored.map(({ method }) => method), ["PUT", "PUT", "PUT", "POST"]);
  assert.equal(server.calls.length, 2);
});

test("a second upload request fails the call without a transfer, and a retry without a response has an unknown outcome", { timeout: 10000 }, async t => {
  let state;
  const server = await files(t, { settings: { upload: {} }, tool: ({ args }) => uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit" }], state) });
  const app = server.app();
  state = "again";
  await assert.rejects(app.tools.save({ file: new Blob(["x"]) }), { message: "files.save: the server asked for a second upload; the tool did not run." });
  assert.deepEqual([server.stored.length, server.calls.length], [1, 2]);
  state = "lost";
  await assert.rejects(app.tools.save({ file: new Blob(["x"]) }), /^Error: files\.save: the outcome is unknown; the tool may have run/);
  assert.deepEqual([server.stored.length, server.calls.length], [2, 3]);
});

test("questions before and after an upload are answered, and the retry that answers the upload does not repeat them", { timeout: 10000 }, async t => {
  const answer = z.object({ value: z.string() });
  const ask = (key, requestState) => inputRequired({ inputRequests: { [key]: inputRequired.elicit({ message: key, requestedSchema: answer }) }, requestState });
  const server = await files(t, {
    settings: { upload: {} },
    tool: ({ args, requestState, inputResponses }) => {
      if (!requestState) return ask("folder", "asked");
      if (requestState === "asked") return uploadRequired([{ fileId: args.file.id, url: `${server.origin}/u`, credentials: "omit" }], `uploading:${acceptedContent(inputResponses, "folder", answer).value}`);
      if (requestState.startsWith("uploading:")) return ask("confirm", `confirm:${requestState.slice(10)}`);
      return text(`saved to ${requestState.slice(8)} after ${acceptedContent(inputResponses, "confirm", answer).value}`);
    },
  });
  const asked = [];
  const result = await server.app().tools.save({ file: new Blob(["x"]) }, { elicit: ({ message }) => { asked.push(message); return { action: "accept", content: { value: message === "folder" ? "inbox" : "yes" } }; } });
  assert.equal(result.content[0].text, "saved to inbox after yes");
  assert.deepEqual(asked, ["folder", "confirm"]);
  assert.equal(server.stored.length, 1);
  assert.deepEqual(server.calls.map(({ inputResponses }) => Object.keys(inputResponses ?? {})), [[], ["folder"], [], ["confirm"]]);
});

test("downloads are fetched through handles that check size and digest, and their targets leave the result", { timeout: 10000 }, async t => {
  const target = (name, size, digest) => ({ name, mimeType: "text/csv", size, ...(digest && { digest: { algorithm: "sha-256", value: digest } }), url: `${server.origin}/d/${name}?sig=x`, credentials: "omit" });
  const server = await files(t, {
    settings: {},
    storage: () => [200, "a,b\n1,2"],
    tool: () => ({ ...text("Exported."), _meta: { [EXTENSION]: { downloads: [target("good.csv", 7, sha256("a,b\n1,2")), target("long.csv", 6), target("forged.csv", 7, sha256("other"))] }, kept: true } }),
  });
  const result = await server.app().tools.save({});
  assert.deepEqual([EXTENSION in result._meta, result._meta.kept], [false, true]);
  assert.deepEqual(result.downloads.map(({ name, size }) => [name, size]), [["good.csv", 7], ["long.csv", 6], ["forged.csv", 7]]);
  const good = await result.downloads[0].blob();
  assert.deepEqual([await good.text(), good.type], ["a,b\n1,2", "text/csv"]);
  await assert.rejects(result.downloads[1].blob(), { message: 'Downloading "long.csv" failed (more than the declared 6 bytes; discarded).' });
  await assert.rejects(result.downloads[2].blob(), { message: 'Downloading "forged.csv" failed (the bytes do not match the digest; discarded).' });
});

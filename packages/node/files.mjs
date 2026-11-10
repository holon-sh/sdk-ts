// Client side of the MCP files extension (draft):
// https://github.com/modelcontextprotocol/experimental-ext-file-uploads/blob/main/specification/draft/file-uploads.md
import { base64, fetchGlobal, sha256 } from "#platform";

export const EXTENSION = "io.modelcontextprotocol/files";

const list = value => Array.isArray(value) ? value : [];
const isObject = value => typeof value === "object" && value !== null && !Array.isArray(value);
const isPlain = value => isObject(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const present = value => isObject(value) ? Object.fromEntries(Object.entries(value).filter(([, member]) => member !== null)) : undefined;
const quoted = name => name === undefined ? "a file" : JSON.stringify(name);

export function settings(client) {
  const advertised = client.getServerCapabilities()?.extensions?.[EXTENSION];
  return isObject(advertised) && advertised.revision == null ? advertised : undefined;
}

const uploadRequests = new WeakSet();
export const isUploadRequest = error => uploadRequests.has(error?.data);

// The MCP client rejects a result type it does not know and drops the result, and has no hook for extension result
// types yet (typescript-sdk#2782). The transport hands an upload request to it as a JSON-RPC error instead, whose data is
// the result: the client keeps an error's data as received. Every other message passes through unchanged.
export function acceptUploadRequests(transport) {
  let handler;
  const receive = (message, extra) => {
    const result = message?.result;
    if (result?.resultType === "upload_required") {
      uploadRequests.add(result);
      message = { jsonrpc: "2.0", id: message.id, error: { code: -32603, message: "Unsupported result type 'upload_required'", data: result } };
    }
    handler?.(message, extra);
  };
  Object.defineProperty(transport, "onmessage", { configurable: true, get: () => handler && receive, set: value => { handler = value; } });
  return transport;
}

function contains(value) {
  if (value instanceof Blob) return true;
  if (Array.isArray(value)) return value.some(contains);
  return isPlain(value) && Object.values(value).some(contains);
}

const resolve = (root, ref) => ref.slice(1).split("/").slice(1)
  .reduce((node, token) => node === null || typeof node !== "object" ? undefined : node[decodeURIComponent(token).replaceAll("~1", "/").replaceAll("~0", "~")], root);

function expand(schemas, root, seen = new Set()) {
  return schemas.flatMap(schema => {
    if (!isObject(schema) || seen.has(schema)) return [];
    seen.add(schema);
    const target = typeof schema.$ref === "string" && schema.$ref.startsWith("#") ? resolve(root, schema.$ref) : undefined;
    return [schema, ...expand([target, ...list(schema.anyOf), ...list(schema.oneOf), ...list(schema.allOf)], root, seen)];
  });
}

function replace(value, schemas, root, path, found, label) {
  if (value instanceof Blob) {
    const schema = expand(schemas, root).find(schema => "x-mcp-file" in schema);
    if (!schema) throw new Error(`${label}: the Blob at ${path || "/"} is not a file argument of the tool; the tool was not called.`);
    const input = {};
    found.push({ blob: value, schema, input });
    return input;
  }
  if (Array.isArray(value)) {
    const all = expand(schemas, root);
    return value.map((item, index) => replace(item, all.map(schema => index < list(schema.prefixItems).length ? schema.prefixItems[index] : schema.items), root, `${path}/${index}`, found, label));
  }
  if (!isPlain(value)) return value;
  const all = expand(schemas, root);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item, all.map(schema => isObject(schema.properties) ? schema.properties[key] : undefined), root, `${path}/${key}`, found, label)]));
}

function baseName(name) {
  const base = typeof name === "string" ? name.split(/[/\\]/).pop() : "";
  return base && base !== "." && base !== ".." ? base : undefined;
}

export async function prepare(args, { label, connection, settings, schema }) {
  const files = new Map();
  if (!contains(args)) return { arguments: args, files };
  if (!connection) throw new Error(`${label}: file arguments need an endpoint binding; the tool was not called.`);
  const server = settings();
  if (!server) throw new Error(`${label}: the server does not accept files; the tool was not called.`);
  const root = await schema();
  const found = [];
  const replaced = replace(args, [root], root, "", found, label);
  await Promise.all(found.map(async ({ blob, schema, input }) => {
    const descriptor = present(schema["x-mcp-file"]) ?? {};
    const name = baseName(blob.name);
    if (blob.size > descriptor.maxSize) throw new Error(`${label}: ${quoted(name)} is ${blob.size} bytes, over the tool's limit of ${descriptor.maxSize}; the tool was not called.`);
    Object.assign(input, { id: crypto.randomUUID(), ...(name && { name }), mimeType: blob.type || "application/octet-stream", size: blob.size });
    if (list(schema.required).includes("digest")) input.digest = { algorithm: "sha-256", value: await sha256(blob) };
    files.set(input.id, { blob, input });
  }));
  let budget = Number.isSafeInteger(server.maxInlineBytes) ? server.maxInlineBytes : 0;
  for (const { blob, input } of [...files.values()].sort((a, b) => a.blob.size - b.blob.size)) {
    if (blob.size === 0) continue;
    if (blob.size <= budget) {
      budget -= blob.size;
      input.data = await base64(blob);
    } else if (!isObject(server.upload)) {
      throw new Error(`${label}: the server cannot receive ${quoted(input.name)} (${blob.size} bytes): it takes ${budget} more bytes inline and no uploads; the tool was not called.`);
    }
  }
  return { arguments: replaced, files };
}

const UPLOAD = new Set(["fileId", "url", "path", "method", "form", "headers", "credentials", "expiresAt", "_meta"]);
const DOWNLOAD = new Set(["name", "mimeType", "size", "digest", "url", "path", "headers", "credentials", "expiresAt", "_meta"]);
const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const FIELD_VALUE = /^(?:[\x21-\x7e\x80-\xff](?:[\t\x20-\x7e\x80-\xff]*[\x21-\x7e\x80-\xff])?)?$/;
// https://fetch.spec.whatwg.org/#forbidden-request-header, plus Authorization.
const FORBIDDEN = new Set(["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "authorization", "connection", "content-length", "cookie", "cookie2", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "via"]);
const OVERRIDES = new Set(["x-http-method-override", "x-http-method", "x-method-override"]);
const ROUTING = new Set(["forwarded", "x-original-url", "x-rewrite-url", ...OVERRIDES]);
const FORM_HEADERS = new Set(["content-type", "content-encoding", "content-range", "content-digest", "repr-digest"]);
const FORM_NAME = /^[^\p{Cc}"\\]+$/u;
const PATH = /^(?:\/(?!\.\.?(?:\/|$))[A-Za-z0-9\-_~.]+)+$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;
const loopback = host => host === "localhost" || host.endsWith(".localhost") || /^127\.\d+\.\d+\.\d+$/.test(host) || host === "[::1]";
const expired = target => target.expiresAt !== undefined && Date.parse(target.expiresAt) <= Date.now();

function parse(url) {
  try { return new URL(url); } catch { return undefined; }
}

function check(raw, kind, { resolved }) {
  const target = present(raw);
  const fail = reason => { throw new Error(reason); };
  if (!target) fail("not an object");
  const unknown = Object.keys(target).find(key => !(kind === "upload" ? UPLOAD : DOWNLOAD).has(key));
  if (unknown !== undefined) fail(`unknown member ${JSON.stringify(unknown)}`);
  if (typeof target.url === "string" === (typeof target.path === "string") || [target.url, target.path].some(value => value !== undefined && typeof value !== "string")) fail("needs exactly one of url and path");
  if (target.credentials !== "omit" && target.credentials !== "include") fail("credentials must be omit or include");
  if (target.expiresAt !== undefined && !(TIMESTAMP.test(target.expiresAt) && !Number.isNaN(Date.parse(target.expiresAt)))) fail("expiresAt is not an RFC 3339 timestamp");
  if (target.headers !== undefined && !(isObject(target.headers) && Object.values(target.headers).every(value => typeof value === "string"))) fail("headers must map names to strings");
  let form;
  if (kind === "upload") {
    if (typeof target.fileId !== "string") fail("fileId is not a string");
    if (![undefined, "PUT", "POST"].includes(target.method)) fail("method must be PUT or POST");
    if (target.form !== undefined) {
      form = present(target.form);
      if (target.method !== "POST") fail("a form target must use POST");
      if (!form || Object.keys(form).some(key => key !== "fields" && key !== "fileField") || !Array.isArray(form.fields) || typeof form.fileField !== "string") fail("form is malformed");
      form = { fileField: form.fileField, fields: form.fields.map(present) };
      if (!FORM_NAME.test(form.fileField)) fail("form fileField is not allowed");
      for (const field of form.fields) {
        if (!field || Object.keys(field).some(key => key !== "name" && key !== "value") || typeof field.name !== "string" || typeof field.value !== "string") fail("a form field is malformed");
        if (!FORM_NAME.test(field.name) || field.name === form.fileField || /[\r\n\0]/.test(field.value)) fail("a form field is not allowed");
      }
    }
  } else {
    if (target.name !== undefined && typeof target.name !== "string") fail("name is not a string");
    if (typeof target.mimeType !== "string") fail("mimeType is not a string");
    if (!Number.isSafeInteger(target.size) || target.size < 0) fail("size is not a non-negative integer");
    const digest = target.digest === undefined ? undefined : present(target.digest);
    if (target.digest !== undefined && (!digest || Object.keys(digest).some(key => key !== "algorithm" && key !== "value") || digest.algorithm !== "sha-256" || typeof digest.value !== "string")) fail("digest is malformed");
  }
  const include = target.credentials === "include";
  for (const [name, value] of Object.entries(target.headers ?? {})) {
    const lower = name.toLowerCase();
    if (!TOKEN.test(name) || !FIELD_VALUE.test(value)) fail("a header is not valid HTTP");
    if (FORBIDDEN.has(lower) || lower.startsWith("proxy-") || lower.startsWith("sec-")
      || OVERRIDES.has(lower) && value.split(",").some(method => ["connect", "trace", "track"].includes(method.trim().toLowerCase()))) fail(`header ${name} is not allowed`);
    if ((target.path !== undefined || include) && (ROUTING.has(lower) || lower.startsWith("x-forwarded-"))) fail(`header ${name} is not allowed with this target`);
    if (form && FORM_HEADERS.has(lower)) fail(`header ${name} is not allowed with a form`);
  }
  const endpoint = new URL(resolved.endpoint);
  const origins = resolved.fileOrigins && new Set(resolved.fileOrigins.map(origin => new URL(origin).origin));
  let url;
  let allowlisted = false;
  if (target.url !== undefined) {
    url = parse(target.url);
    if (!url || url.username || url.password) fail("url is not an absolute URL without userinfo");
    allowlisted = origins?.has(url.origin) ?? false;
    if (origins && !allowlisted) fail("url is not on fileOrigins");
    if (url.protocol !== "https:" && !(url.protocol === "http:" && allowlisted && loopback(url.hostname))) fail("url is not https");
    if (include && url.origin !== endpoint.origin) fail("credentials include is honored only at the server's origin");
  } else {
    if (!PATH.test(target.path)) fail("path is not a valid path");
    if (endpoint.protocol !== "https:" && !loopback(endpoint.hostname) && !origins?.has(endpoint.origin)) fail("a path under an http MCP address needs loopback or fileOrigins");
    url = new URL(endpoint);
    url.pathname = url.pathname.replace(/\/$/, "") + target.path;
    url.hash = "";
  }
  return { url: url.href, path: target.path !== undefined, allowlisted, include, headers: target.headers ?? {}, method: target.method ?? "PUT", form, size: target.size, expiresAt: target.expiresAt };
}

function send(target, init, { resolved, authorization }) {
  const headers = new Headers(target.headers);
  if (target.include && authorization) headers.set("authorization", authorization);
  if (target.path && resolved.installationUID) headers.set("x-holon-installation-uid", resolved.installationUID);
  const transport = target.path || target.allowlisted ? fetch : fetchGlobal;
  return transport(target.url, { ...init, headers, credentials: "omit", redirect: "error" });
}

const reason = error => error?.cause?.message ?? error?.message ?? String(error);
const TYPE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+(?:[ \t]*;[ \t]*[!#$%&'*+.^_`|~0-9A-Za-z-]+=(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+|"(?:[\t\x20\x21\x23-\x5b\x5d-\x7e]|\\[\t\x20-\x7e])*"))*$/;

// fetch's own FormData boundary has too little randomness for the extension (128 bits), so the body is built here,
// encoding names and the filename as the WHATWG multipart/form-data algorithm does.
function multipart({ fields, fileField }, { blob, input }) {
  const boundary = `----holon${Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("")}`;
  const filename = (baseName(input.name) ?? "file").replaceAll('"', "%22").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  const parts = fields.map(({ name, value }) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${TYPE.test(input.mimeType) ? input.mimeType : "application/octet-stream"}\r\n\r\n`, blob, `\r\n--${boundary}--\r\n`);
  return { body: new Blob(parts), type: `multipart/form-data; boundary=${boundary}` };
}

async function transfer(target, file, connection, signal) {
  const { body, type } = target.form ? multipart(target.form, file) : { body: file.blob.slice(0, file.blob.size, "") };
  for (let attempt = 0; ; attempt++) {
    if (expired(target)) throw new Error("its target expired");
    let response;
    try {
      response = await send(type ? { ...target, headers: { ...target.headers, "Content-Type": type } } : target, { method: target.method, body, signal }, connection);
    } catch (error) {
      if (signal.aborted || target.method !== "PUT" || attempt === 2) throw new Error(reason(error));
    }
    if (response) {
      await response.body?.cancel();
      if (response.ok) return;
      const retry = response.status >= 500 || response.status === 408 || response.status === 429;
      if (target.method !== "PUT" || !retry || attempt === 2) throw new Error(`HTTP ${response.status}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
  }
}

export async function upload(request, files, connection, signal, label) {
  const fail = reason => new Error(`${label}: ${reason}; the tool did not run.`);
  if (typeof request.requestState !== "string") throw fail("the server's upload request has no requestState");
  const waiting = new Set([...files.values()].filter(({ input }) => input.size > 0 && input.data === undefined).map(({ input }) => input.id));
  const ids = list(request.uploads).map(target => target?.fileId);
  if (!Array.isArray(request.uploads) || ids.length !== waiting.size || new Set(ids).size !== ids.length || !ids.every(id => waiting.has(id))) {
    throw fail("the server's upload request does not list each file sent without data exactly once");
  }
  const targets = request.uploads.map(target => {
    const file = files.get(target.fileId);
    try { return { file, target: check(target, "upload", connection) }; } catch (error) { throw fail(`the upload target for ${quoted(file.input.name)} was rejected (${error.message})`); }
  });
  const controller = new AbortController();
  const stop = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  await Promise.all(targets.map(async ({ file, target }) => {
    try {
      await transfer(target, file, connection, stop);
    } catch (error) {
      controller.abort();
      throw fail(signal?.aborted ? "the call was cancelled during the upload" : `uploading ${quoted(file.input.name)} failed (${error.message})`);
    }
  }));
}

function download(raw, connection) {
  const { name, mimeType, size, digest, expiresAt } = present(raw) ?? {};
  const label = `Downloading ${quoted(typeof name === "string" ? name : undefined)}`;
  const blob = async ({ signal } = {}) => {
    let target;
    try { target = check(raw, "download", connection); } catch (error) { throw new Error(`${label} was refused: its target was rejected (${error.message}).`); }
    if (expired(target)) throw new Error(`${label} was refused: its target expired.`);
    const chunks = [];
    let received = 0;
    try {
      const response = await send(target, { method: "GET", signal }, connection);
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      for (let chunk; reader && !(chunk = await reader.read()).done;) {
        received += chunk.value.byteLength;
        if (received > size) {
          await reader.cancel();
          throw new Error(`more than the declared ${size} bytes; discarded`);
        }
        chunks.push(chunk.value);
      }
    } catch (error) {
      throw new Error(`${label} failed (${reason(error)}).`);
    }
    if (received !== size) throw new Error(`${label} failed (${received} bytes, not the declared ${size}; discarded).`);
    const file = new Blob(chunks, { type: mimeType });
    if (digest && await sha256(file) !== digest.value) throw new Error(`${label} failed (the bytes do not match the digest; discarded).`);
    return file;
  };
  return Object.freeze({ ...Object.fromEntries(Object.entries({ name, mimeType, size, digest, expiresAt }).filter(([, value]) => value !== undefined)), blob });
}

export function downloads(result, connection, enabled) {
  if (result.resultType === "input_required" || !isObject(result._meta) || !(EXTENSION in result._meta)) return result;
  const { [EXTENSION]: meta, ...rest } = result._meta;
  const handles = enabled ? list(meta?.downloads).map(target => download(target, connection)) : [];
  return { ...result, _meta: rest, ...(handles.length && { downloads: handles }) };
}

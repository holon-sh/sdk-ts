// Client side of the MCP files extension (draft):
// https://github.com/modelcontextprotocol/experimental-ext-file-uploads/blob/main/specification/draft/file-uploads.md
import type { Client, JSONRPCMessage, MessageExtraInfo, Transport } from "@modelcontextprotocol/client";
import { base64, fetchGlobal, sha256 } from "#platform";
import { EXTENSION, type Download } from "./files.js";

type Json = Record<string, unknown>;

interface FileConnection {
  client: Pick<Client, "getServerCapabilities">;
  resolved: { endpoint: URL | string; fileOrigins?: string[]; installationUID?: string };
  authorization?: string;
}

interface FileInput { id: string; name?: string; mimeType: string; size: number; digest?: { algorithm: "sha-256"; value: string }; data?: string }
interface Attachment { blob: Blob; input: FileInput }
type Files = Map<string, Attachment>;

const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const isPlain = (value: unknown): value is Json => isObject(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const present = (value: unknown): Json | undefined => isObject(value) ? Object.fromEntries(Object.entries(value).filter(([, member]) => member !== null)) : undefined;
const quoted = (name: string | undefined) => name === undefined ? "a file" : JSON.stringify(name);

function refuse(reason: string): never {
  throw new Error(reason);
}

function settings({ client }: FileConnection): Json | undefined {
  const advertised = client.getServerCapabilities()?.extensions?.[EXTENSION];
  return isObject(advertised) && advertised.revision == null ? advertised : undefined;
}

const uploadRequests = new WeakSet<object>();

export function isUploadRequest(error: unknown): error is { data: Json } {
  const data = (error as { data?: unknown } | null | undefined)?.data;
  return isObject(data) && uploadRequests.has(data);
}

// The MCP client rejects a result type it does not know and drops the result, and has no hook for extension result
// types yet (typescript-sdk#2782). The transport hands an upload request to it as a JSON-RPC error instead, whose data is
// the result: the client keeps an error's data as received. Every other message passes through unchanged.
export function acceptUploadRequests<T extends Transport>(transport: T): T {
  let handler: Transport["onmessage"];
  const receive = (message: JSONRPCMessage, extra?: MessageExtraInfo) => {
    if ("result" in message && message.result?.resultType === "upload_required") {
      uploadRequests.add(message.result);
      message = { jsonrpc: "2.0", id: message.id, error: { code: -32603, message: "Unsupported result type 'upload_required'", data: message.result } };
    }
    handler?.(message, extra);
  };
  Object.defineProperty(transport, "onmessage", { configurable: true, get: () => handler && receive, set: (value: Transport["onmessage"]) => { handler = value; } });
  return transport;
}

function contains(value: unknown): boolean {
  if (value instanceof Blob) return true;
  if (Array.isArray(value)) return value.some(contains);
  return isPlain(value) && Object.values(value).some(contains);
}

const resolve = (root: unknown, ref: string) => ref.slice(1).split("/").slice(1)
  .reduce<unknown>((node, token) => node === null || typeof node !== "object" ? undefined : (node as Json)[decodeURIComponent(token).replaceAll("~1", "/").replaceAll("~0", "~")], root);

function expand(schemas: unknown[], root: unknown, seen = new Set<object>()): Json[] {
  return schemas.flatMap(schema => {
    if (!isObject(schema) || seen.has(schema)) return [];
    seen.add(schema);
    const target = typeof schema.$ref === "string" && schema.$ref.startsWith("#") ? resolve(root, schema.$ref) : undefined;
    return [schema, ...expand([target, ...list(schema.anyOf), ...list(schema.oneOf), ...list(schema.allOf)], root, seen)];
  });
}

interface Found { blob: Blob; schema: Json; input: FileInput }

function replace(value: unknown, schemas: unknown[], root: unknown, path: string, found: Found[], label: string): unknown {
  if (value instanceof Blob) {
    const schema = expand(schemas, root).find(schema => "x-mcp-file" in schema);
    if (!schema) throw new Error(`${label}: the Blob at ${path || "/"} is not a file argument of the tool; the tool was not called.`);
    const input = {} as FileInput;
    found.push({ blob: value, schema, input });
    return input;
  }
  if (Array.isArray(value)) {
    const all = expand(schemas, root);
    return value.map((item, index) => replace(item, all.map(schema => index < list(schema.prefixItems).length ? list(schema.prefixItems)[index] : schema.items), root, `${path}/${index}`, found, label));
  }
  if (!isPlain(value)) return value;
  const all = expand(schemas, root);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item, all.map(schema => isObject(schema.properties) ? schema.properties[key] : undefined), root, `${path}/${key}`, found, label)]));
}

function baseName(name: unknown): string | undefined {
  const base = typeof name === "string" ? name.split(/[/\\]/).pop() : "";
  return base && base !== "." && base !== ".." ? base : undefined;
}

export async function prepare<C extends FileConnection>(args: Json | undefined, { label, connection, schema }: { label: string; connection: C | undefined; schema: (connection: C) => Promise<unknown> }): Promise<{ arguments: Json | undefined; files: Files }> {
  const files: Files = new Map();
  if (!contains(args)) return { arguments: args, files };
  if (!connection) throw new Error(`${label}: file arguments need an endpoint binding; the tool was not called.`);
  const server = settings(connection);
  if (!server) throw new Error(`${label}: the server does not accept files; the tool was not called.`);
  const root = await schema(connection);
  const found: Found[] = [];
  const replaced = replace(args, [root], root, "", found, label) as Json;
  await Promise.all(found.map(async ({ blob, schema, input }) => {
    const descriptor = present(schema["x-mcp-file"]) ?? {};
    const name = baseName((blob as { name?: unknown }).name);
    if (blob.size > (descriptor.maxSize as number)) throw new Error(`${label}: ${quoted(name)} is ${blob.size} bytes, over the tool's limit of ${descriptor.maxSize}; the tool was not called.`);
    Object.assign(input, { id: crypto.randomUUID(), ...(name !== undefined && { name }), mimeType: blob.type || "application/octet-stream", size: blob.size });
    if (list(schema.required).includes("digest")) input.digest = { algorithm: "sha-256", value: await sha256(blob) };
    files.set(input.id, { blob, input });
  }));
  let budget = Number.isSafeInteger(server.maxInlineBytes) ? server.maxInlineBytes as number : 0;
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

interface Form { fileField: string; fields: Array<{ name: string; value: string }> }
interface Target { url: string; path: boolean; allowlisted: boolean; include: boolean; headers: Record<string, string>; method: string; form?: Form; expiresAt?: string }

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
const loopback = (host: string) => host === "localhost" || host.endsWith(".localhost") || /^127\.\d+\.\d+\.\d+$/.test(host) || host === "[::1]";
const expired = (target: { expiresAt?: string }) => target.expiresAt !== undefined && Date.parse(target.expiresAt) <= Date.now();
const timestamp = (value: unknown): value is string | undefined => value === undefined || typeof value === "string" && TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));

function parse(url: string): URL | undefined {
  try { return new URL(url); } catch { return undefined; }
}

function check(raw: unknown, kind: "upload" | "download", { resolved }: FileConnection): Target {
  const target = present(raw);
  if (!target) refuse("not an object");
  const unknown = Object.keys(target).find(key => !(kind === "upload" ? UPLOAD : DOWNLOAD).has(key));
  if (unknown !== undefined) refuse(`unknown member ${JSON.stringify(unknown)}`);
  if (typeof target.url === "string" === (typeof target.path === "string") || [target.url, target.path].some(value => value !== undefined && typeof value !== "string")) refuse("needs exactly one of url and path");
  if (target.credentials !== "omit" && target.credentials !== "include") refuse("credentials must be omit or include");
  const { expiresAt } = target;
  if (!timestamp(expiresAt)) refuse("expiresAt is not an RFC 3339 timestamp");
  if (target.headers !== undefined && !(isObject(target.headers) && Object.values(target.headers).every(value => typeof value === "string"))) refuse("headers must map names to strings");
  const headers = (target.headers ?? {}) as Record<string, string>;
  let form: Form | undefined;
  if (kind === "upload") {
    if (typeof target.fileId !== "string") refuse("fileId is not a string");
    if (target.method !== undefined && target.method !== "PUT" && target.method !== "POST") refuse("method must be PUT or POST");
    if (target.form !== undefined) {
      const raw = present(target.form);
      if (target.method !== "POST") refuse("a form target must use POST");
      if (!raw || Object.keys(raw).some(key => key !== "fields" && key !== "fileField") || !Array.isArray(raw.fields) || typeof raw.fileField !== "string") refuse("form is malformed");
      const fields = raw.fields.map(present);
      if (!FORM_NAME.test(raw.fileField)) refuse("form fileField is not allowed");
      for (const field of fields) {
        if (!field || Object.keys(field).some(key => key !== "name" && key !== "value") || typeof field.name !== "string" || typeof field.value !== "string") refuse("a form field is malformed");
        if (!FORM_NAME.test(field.name) || field.name === raw.fileField || /[\r\n\0]/.test(field.value)) refuse("a form field is not allowed");
      }
      form = { fileField: raw.fileField, fields: fields as Form["fields"] };
    }
  }
  const include = target.credentials === "include";
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (!TOKEN.test(name) || !FIELD_VALUE.test(value)) refuse("a header is not valid HTTP");
    if (FORBIDDEN.has(lower) || lower.startsWith("proxy-") || lower.startsWith("sec-")
      || OVERRIDES.has(lower) && value.split(",").some(method => ["connect", "trace", "track"].includes(method.trim().toLowerCase()))) refuse(`header ${name} is not allowed`);
    if ((target.path !== undefined || include) && (ROUTING.has(lower) || lower.startsWith("x-forwarded-"))) refuse(`header ${name} is not allowed with this target`);
    if (form && FORM_HEADERS.has(lower)) refuse(`header ${name} is not allowed with a form`);
  }
  const endpoint = new URL(resolved.endpoint);
  const origins = resolved.fileOrigins && new Set(resolved.fileOrigins.map(origin => new URL(origin).origin));
  let url: URL;
  let allowlisted = false;
  if (typeof target.url === "string") {
    const parsed = parse(target.url);
    if (!parsed || parsed.username || parsed.password) refuse("url is not an absolute URL without userinfo");
    url = parsed;
    allowlisted = origins?.has(url.origin) ?? false;
    if (origins && !allowlisted) refuse("url is not on fileOrigins");
    if (url.protocol !== "https:" && !(url.protocol === "http:" && allowlisted && loopback(url.hostname))) refuse("url is not https");
    if (include && url.origin !== endpoint.origin) refuse("credentials include is honored only at the server's origin");
  } else {
    const path = target.path as string;
    if (!PATH.test(path)) refuse("path is not a valid path");
    if (endpoint.protocol !== "https:" && !loopback(endpoint.hostname) && !origins?.has(endpoint.origin)) refuse("a path under an http MCP address needs loopback or fileOrigins");
    url = new URL(endpoint);
    url.pathname = url.pathname.replace(/\/$/, "") + path;
    url.hash = "";
  }
  return { url: url.href, path: target.path !== undefined, allowlisted, include, headers, method: (target.method ?? "PUT") as string, form, expiresAt };
}

function send(target: Target, init: RequestInit, { resolved, authorization }: FileConnection): Promise<Response> {
  const headers = new Headers(target.headers);
  if (target.include && authorization) headers.set("authorization", authorization);
  if (target.path && resolved.installationUID) headers.set("x-holon-installation-uid", resolved.installationUID);
  return (target.path || target.allowlisted ? fetch : fetchGlobal)(target.url, { ...init, headers, credentials: "omit", redirect: "error" });
}

const reason = (error: unknown) => {
  const { message, cause } = (error ?? {}) as { message?: unknown; cause?: { message?: unknown } };
  return String(cause?.message ?? message ?? error);
};
const TYPE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+(?:[ \t]*;[ \t]*[!#$%&'*+.^_`|~0-9A-Za-z-]+=(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+|"(?:[\t\x20\x21\x23-\x5b\x5d-\x7e]|\\[\t\x20-\x7e])*"))*$/;

// fetch's own FormData boundary has too little randomness for the extension (128 bits), so the body is built here,
// encoding names and the filename as the WHATWG multipart/form-data algorithm does.
function multipart({ fields, fileField }: Form, { blob, input }: Attachment): { body: Blob; type: string } {
  const boundary = `----holon${Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("")}`;
  const filename = (baseName(input.name) ?? "file").replaceAll('"', "%22").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  const parts: Array<string | Blob> = fields.map(({ name, value }) => `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${TYPE.test(input.mimeType) ? input.mimeType : "application/octet-stream"}\r\n\r\n`, blob, `\r\n--${boundary}--\r\n`);
  return { body: new Blob(parts), type: `multipart/form-data; boundary=${boundary}` };
}

async function transfer(target: Target, file: Attachment, connection: FileConnection, signal: AbortSignal): Promise<void> {
  const { body, type } = target.form ? multipart(target.form, file) : { body: file.blob.slice(0, file.blob.size, ""), type: undefined };
  for (let attempt = 0; ; attempt++) {
    if (expired(target)) throw new Error("its target expired");
    let response: Response | undefined;
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

export async function upload(request: Json, files: Files, connection: FileConnection, signal: AbortSignal | undefined, label: string): Promise<string> {
  const fail = (reason: string) => new Error(`${label}: ${reason}; the tool did not run.`);
  const { requestState, uploads } = request;
  if (typeof requestState !== "string") throw fail("the server's upload request has no requestState");
  const waiting = new Set<unknown>([...files.values()].filter(({ input }) => input.size > 0 && input.data === undefined).map(({ input }) => input.id));
  const ids = list(uploads).map(target => (target as { fileId?: unknown } | null | undefined)?.fileId);
  if (!Array.isArray(uploads) || ids.length !== waiting.size || new Set(ids).size !== ids.length || !ids.every(id => waiting.has(id))) {
    throw fail("the server's upload request does not list each file sent without data exactly once");
  }
  const targets = uploads.map((target: { fileId: string }) => {
    const file = files.get(target.fileId)!;
    try { return { file, target: check(target, "upload", connection) }; } catch (error) { throw fail(`the upload target for ${quoted(file.input.name)} was rejected (${(error as Error).message})`); }
  });
  const controller = new AbortController();
  const stop = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  await Promise.all(targets.map(async ({ file, target }) => {
    try {
      await transfer(target, file, connection, stop);
    } catch (error) {
      controller.abort();
      throw fail(signal?.aborted ? "the call was cancelled during the upload" : `uploading ${quoted(file.input.name)} failed (${(error as Error).message})`);
    }
  }));
  return requestState;
}

function download(raw: unknown, connection: FileConnection): Download | undefined {
  const { name, mimeType, size, digest, expiresAt }: Json = present(raw) ?? {};
  if (name !== undefined && typeof name !== "string" || typeof mimeType !== "string" || typeof size !== "number" || !Number.isSafeInteger(size) || size < 0 || !timestamp(expiresAt)) return undefined;
  let value: string | undefined;
  if (digest !== undefined) {
    const given = present(digest);
    if (!given || Object.keys(given).some(key => key !== "algorithm" && key !== "value") || given.algorithm !== "sha-256" || typeof given.value !== "string") return undefined;
    value = given.value;
  }
  const label = `Downloading ${quoted(name)}`;
  const blob = async ({ signal }: { signal?: AbortSignal } = {}) => {
    let target: Target;
    try { target = check(raw, "download", connection); } catch (error) { throw new Error(`${label} was refused: its target was rejected (${(error as Error).message}).`); }
    if (expired(target)) throw new Error(`${label} was refused: its target expired.`);
    const chunks: Uint8Array[] = [];
    let received = 0;
    try {
      const response = await send(target, { method: "GET", signal }, connection);
      if (response.status !== 200) {
        await response.body?.cancel();
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body?.getReader();
      while (reader) {
        const chunk = await reader.read();
        if (chunk.done) break;
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
    if (value !== undefined && await sha256(file) !== value) throw new Error(`${label} failed (the bytes do not match the digest; discarded).`);
    return file;
  };
  return Object.freeze({ ...(name !== undefined && { name }), mimeType, size, ...(value !== undefined && { digest: { algorithm: "sha-256" as const, value } }), ...(expiresAt !== undefined && { expiresAt }), blob });
}

export function downloads<R extends { resultType?: string; _meta?: object }>(result: R, connection: FileConnection): R & { downloads?: Download[] } {
  if (result.resultType === "input_required" || !isObject(result._meta) || !(EXTENSION in result._meta)) return result;
  const { [EXTENSION]: meta, ...rest } = result._meta;
  const handles = settings(connection) ? list((meta as { downloads?: unknown } | null | undefined)?.downloads).flatMap(target => download(target, connection) ?? []) : [];
  return { ...result, _meta: rest, ...(handles.length > 0 && { downloads: handles }) };
}

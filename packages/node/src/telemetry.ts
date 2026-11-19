import { context, propagation, SpanKind, SpanStatusCode, trace, type Attributes, type Context, type Span, type TextMapGetter } from "@opentelemetry/api";

// Trace context for MCP calls under the conventions holon-api uses (holon/internal/api/telemetry_attributes.go): W3C
// trace context in the HTTP headers and in params._meta (MCP SEP-414), headers winning when both are present. Only
// @opentelemetry/api is used here, so a browser bundle stays free of the SDK; without a registered propagator, nothing is
// read or written.

/** The params._meta keys that carry trace context. A caller's own values for them are replaced when there is a context to send. */
export const TRACE_KEYS = ["traceparent", "tracestate", "baggage"] as const;

const tracer = () => trace.getTracer("holon-sh");

// The JSON-RPC codes for requests the server could not serve, not server failures, which leave error.type unset as
// holon-api's mcpCallerErrors do.
const callerErrors = new Set([-32700, -32600, -32601, -32602, -32002, -32023, -32024, -32025, -32026, -32027]);

type Fields = Record<string, unknown>;
const isObject = (value: unknown): value is Fields => typeof value === "object" && value !== null && !Array.isArray(value);

// Connection handshakes get no span. Against a 2025-era server a <NAME>_MCP_URL dependency, which connects per call,
// initializes on every call, so their spans would double a trace's size and say nothing about the call.
const handshakes = new Set(["initialize", "notifications/initialized", "server/discover"]);

/** Whether a message is worth a span: anything but a connection handshake. */
export const isTraced = ({ method }: Message): boolean => !handshakes.has(method);

/** The name of the app this process runs: OTEL_SERVICE_NAME, which Holon sets in an app's pod, when present. */
export function appName(fallback?: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.OTEL_SERVICE_NAME || fallback;
}

/** A JSON-RPC request or notification: its method, id, tool name, and params._meta. */
export interface Message { method: string; id?: string | number; tool?: string; meta?: Fields }

/** Read a single JSON-RPC request or notification, or undefined for anything else (a batch, a response, garbage). */
export function messageOf(value: unknown): Message | undefined {
  if (!isObject(value) || typeof value.method !== "string") return undefined;
  const params = isObject(value.params) ? value.params : undefined;
  const id = typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined;
  const tool = value.method === "tools/call" && typeof params?.name === "string" ? params.name : undefined;
  return { method: value.method, ...(id !== undefined && { id }), ...(tool !== undefined && { tool }), ...(isObject(params?._meta) && { meta: params._meta }) };
}

const metaGetter: TextMapGetter<Fields> = {
  keys: carrier => Object.keys(carrier),
  get: (carrier, key) => (typeof carrier[key] === "string" ? carrier[key] : undefined),
};

/** The context a request continues: the headers' trace context when they carry one, otherwise params._meta's. */
export function incoming(headers: Record<string, string | string[] | undefined>, meta: Fields | undefined): Context {
  const flat: Fields = {};
  for (const key of TRACE_KEYS) {
    const value = headers[key];
    if (value !== undefined) flat[key] = Array.isArray(value) ? value.join(",") : value;
  }
  return propagation.extract(context.active(), flat.traceparent !== undefined ? flat : (meta ?? {}), metaGetter);
}

/**
 * params with _meta's trace context replaced by the active context's; other _meta keys stay. Without a context to send,
 * as in a page that registered no propagator, the caller's own trace keys stay, so a page can still set traceparent.
 */
export function withTraceMeta(params: unknown, active: Context = context.active()): Fields {
  const base = isObject(params) ? params : {};
  const meta: Fields = isObject(base._meta) ? { ...base._meta } : {};
  const injected: Fields = {};
  propagation.inject(active, injected);
  if (injected.traceparent !== undefined) {
    for (const key of TRACE_KEYS) delete meta[key];
    Object.assign(meta, injected);
  }
  return { ...base, _meta: meta };
}

/** Add the active context's trace context to HTTP headers. */
export function injectHeaders(headers: Headers, active: Context = context.active()): void {
  propagation.inject(active, headers, { set: (carrier, key, value) => carrier.set(key, value) });
}

const nameOf = ({ method, tool }: Message) => (tool ? `${method} ${tool}` : method);
const attributesOf = ({ method, tool }: Message): Attributes => ({ "mcp.method.name": method, ...(tool && { "gen_ai.tool.name": tool }) });

/** Start the app's SERVER span for an MCP request it answers. */
export function startServer(message: Message, parent: Context, app: string | undefined): Span {
  return tracer().startSpan(nameOf(message), { kind: SpanKind.SERVER, attributes: { ...attributesOf(message), ...(app && { "holon.app": app }) } }, parent);
}

/** Start a CLIENT span for an MCP request the app sends to a dependency. */
export function startClient(message: Message, callee: { name: string; kind: "app" | "remote" }, caller: string | undefined): Span {
  return tracer().startSpan(nameOf(message), {
    kind: SpanKind.CLIENT,
    attributes: { ...attributesOf(message), "holon.callee": callee.name, "holon.callee.kind": callee.kind, ...(caller && { "holon.caller.app": caller }) },
  });
}

/**
 * End a span with a call's outcome, as holon-api records it: a JSON-RPC error sets rpc.response.status_code and, unless
 * the caller made it, error.type and an error status; a tool result with isError sets error.type tool_error.
 */
export function finish(span: Span, response: unknown, failure?: string): void {
  if (failure) {
    span.setAttribute("error.type", failure);
    span.setStatus({ code: SpanStatusCode.ERROR });
  } else if (isObject(response) && isObject(response.error)) {
    const code = response.error.code;
    if (typeof code === "number") {
      span.setAttribute("rpc.response.status_code", String(code));
      if (!callerErrors.has(code)) {
        span.setAttribute("error.type", String(code));
        span.setStatus({ code: SpanStatusCode.ERROR, ...(typeof response.error.message === "string" && { message: response.error.message }) });
      }
    }
  } else if (isObject(response) && isObject(response.result) && response.result.isError === true) {
    span.setAttribute("error.type", "tool_error");
    span.setStatus({ code: SpanStatusCode.ERROR });
  }
  span.end();
}

// A response bigger than this keeps its span's outcome unknown rather than buffering it; tool results can be large.
const MAX_WATCHED = 4 * 1024 * 1024;

/**
 * Watches a response body for the JSON-RPC response to one request: the whole body for application/json, each event's
 * data for text/event-stream. It reads a copy of the bytes and never changes them.
 */
export class ResponseWatcher {
  #decoder = new TextDecoder();
  #buffer = "";
  #found: unknown;
  #overflow = false;
  readonly #sse: boolean;
  readonly #id: string | number | undefined;

  constructor(contentType: string | null, id: string | number | undefined) {
    this.#sse = /^text\/event-stream\b/i.test(contentType ?? "");
    this.#id = id;
  }

  push(chunk: Uint8Array): void {
    if (this.#found !== undefined || this.#overflow) return;
    this.#buffer += this.#decoder.decode(chunk, { stream: true });
    if (this.#sse) this.#events();
    if (this.#buffer.length > MAX_WATCHED) (this.#overflow = true), (this.#buffer = "");
  }

  /** The response found, after the body ended. */
  result(): unknown {
    if (this.#found === undefined && !this.#overflow) {
      this.#buffer += this.#decoder.decode();
      if (this.#sse) this.#events(true);
      else this.#match(this.#buffer);
    }
    return this.#found;
  }

  #events(final = false) {
    const events = this.#buffer.replaceAll("\r\n", "\n").split("\n\n");
    this.#buffer = final ? "" : events.pop()!;
    for (const event of events) {
      const data = event.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(line.startsWith("data: ") ? 6 : 5));
      if (data.length && this.#match(data.join("\n"))) return;
    }
  }

  #match(text: string): boolean {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      return false;
    }
    if (isObject(value) && ("result" in value || "error" in value) && (this.#id === undefined || value.id === this.#id)) this.#found = value;
    return this.#found !== undefined;
  }
}

export { context, trace };

import { Validator, type SchemaDraft } from "@cfworker/json-schema";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CacheableRequestOptions, JSONRPCMessage, MessageExtraInfo, PriorDiscovery, ServerCapabilities, StandardSchemaV1, Transport as McpTransport, jsonSchemaValidator } from "@modelcontextprotocol/client";
import { fetchPeer } from "#platform";
import { EXTENSION } from "./ext/files.js";
import { appName, context, finish, injectHeaders, isTraced, messageOf, startClient, trace, withTraceMeta } from "./telemetry.js";
import type { CallOptions } from "./protocol.js";
import type { Binding, EndpointBinding, Identity, ToolSession } from "./runtime.js";

interface Connection {
  client: Client;
  resolved: EndpointBinding;
  authorization?: string;
  ready: Promise<void>;
  capabilities(): Promise<ServerCapabilities | undefined>;
  close(): Promise<void>;
}

interface Shared {
  readonly name: string;
  session<T>(options: CallOptions | undefined, run: (client: ToolSession, connection?: Connection) => Promise<T>): Promise<T>;
}
/** A link through a session something else owns. */
export interface HostedLink extends Shared { readonly hosted: true }
/** A link to an MCP endpoint. */
export interface EndpointLink extends Shared {
  readonly hosted: false;
  connected<T>(options: CallOptions | undefined, run: (connection: Connection) => Promise<T>): Promise<T>;
  endpoint(): Endpoint;
  connect(binding: Endpoint, streamEnded?: StreamEnded): Connection;
  close(): Promise<void>;
}
export type Link = HostedLink | EndpointLink;

const PRIOR: unique symbol = Symbol("prior");
// https://modelcontextprotocol.io/specification/2026-07-28/server/discover
const peer: PriorDiscovery = { kind: "modern", discover: { resultType: "complete", supportedVersions: ["2026-07-28"], capabilities: { tools: {} } } };

type Endpoint = EndpointBinding & { [PRIOR]?: PriorDiscovery };

export function environment(name: string): Endpoint {
  const prefix = `${name.toUpperCase().replaceAll("-", "_")}_MCP_`;
  const endpoint = process.env[`${prefix}URL`];
  const token = process.env[`${prefix}TOKEN`];
  if (endpoint) return { endpoint, scoped: true, fetch: fetchPeer, [PRIOR]: peer, ...(token && { authProvider: { token: async () => token } }) };
  throw new Error(`Dependency ${name} is unavailable (${prefix}URL). Provide a binding or set the environment variable.`);
}

// https://github.com/modelcontextprotocol/experimental-ext-file-uploads/blob/main/specification/draft/file-uploads.md
const extensionResultTypes = new Set<unknown>(["upload_required"]);
const extensionResults = new WeakSet<object>();

export type ExtensionResult = { resultType: string } & Record<string, unknown>;

export function extensionResult(error: unknown): ExtensionResult | undefined {
  const data = (error as { data?: object } | null | undefined)?.data;
  return data && extensionResults.has(data) ? data as ExtensionResult : undefined;
}

// The MCP client rejects a result type it does not know and drops the result, and has no hook for extension result
// types yet (typescript-sdk#2782). The transport hands such a result to it as a JSON-RPC error instead, whose data is
// the result: the client keeps an error's data as received. Every other message passes through unchanged.
function acceptExtensionResults<T extends McpTransport>(transport: T): T {
  let handler: McpTransport["onmessage"];
  const receive = (message: JSONRPCMessage, extra?: MessageExtraInfo) => {
    if ("result" in message && extensionResultTypes.has(message.result.resultType)) {
      extensionResults.add(message.result);
      message = { jsonrpc: "2.0", id: message.id, error: { code: -32603, message: `Unsupported result type '${message.result.resultType}'`, data: message.result } };
    }
    handler?.(message, extra);
  };
  Object.defineProperty(transport, "onmessage", { configurable: true, get: () => handler && receive, set: (value: McpTransport["onmessage"]) => { handler = value; } });
  return transport;
}

type Sent = Parameters<StreamableHTTPClientTransport["send"]>;
type StreamEnded = (message: Sent[0]) => void;

class Transport extends StreamableHTTPClientTransport {
  readonly #streamEnded?: StreamEnded;
  constructor(url: URL, options: ConstructorParameters<typeof StreamableHTTPClientTransport>[1], streamEnded?: StreamEnded) {
    super(url, options);
    this.#streamEnded = streamEnded;
  }
  override send(...[message, options]: Sent): Promise<void> {
    const streamEnded = this.#streamEnded;
    if (!streamEnded) return super.send(message, options);
    return super.send(message, { ...options, onRequestStreamEnd: () => { options?.onRequestStreamEnd?.(); streamEnded(message); } });
  }
}

/**
 * Traces the requests a transport sends: a CLIENT span per request, with the span's trace context in params._meta and,
 * through the transport's fetch, which runs in the span's context, in the HTTP headers. A span ends with its response,
 * its cancellation, or the transport closing. Responses pass through the onmessage already installed, such as
 * acceptExtensionResults', whose extension results the span records as the results they arrived as.
 */
function traced<T extends StreamableHTTPClientTransport>(transport: T, callee: string, caller: string | undefined): T {
  const pending = new Map<string | number, (response?: unknown, failure?: string) => void>();
  const settle = (id: unknown, response?: unknown, failure?: string) => {
    const end = (typeof id === "string" || typeof id === "number") && pending.get(id);
    if (end) pending.delete(id as string | number), end(response, failure);
  };
  const send = transport.send.bind(transport);
  transport.send = (message, options) => {
    const request = messageOf(message);
    // An older server learns of a cancellation from this notification; a 2026-era one from requestSignal, below.
    if (request?.method === "notifications/cancelled") settle((message as { params?: { requestId?: unknown } }).params?.requestId, undefined, "cancelled");
    if (!request || request.id === undefined || !isTraced(request)) return send(message, options);
    const { id } = request;
    settle(id);
    const span = startClient(request, { name: callee, kind: "app" }, caller);
    const ended = new AbortController();
    pending.set(id, (response, failure) => { ended.abort(); finish(span, response, failure); });
    options?.requestSignal?.addEventListener("abort", () => settle(id, undefined, "cancelled"), { once: true, signal: ended.signal });
    const active = trace.setSpan(context.active(), span);
    const sent = { ...message, params: withTraceMeta((message as { params?: unknown }).params, active) } as typeof message;
    return context.with(active, () => send(sent, options)).catch((error: unknown) => {
      if (!ended.signal.aborted) settle(id, undefined, "transport");
      throw error;
    });
  };
  const previous = Object.getOwnPropertyDescriptor(transport, "onmessage");
  type Receive = NonNullable<StreamableHTTPClientTransport["onmessage"]>;
  let handler: Receive | undefined = previous?.get ? undefined : previous?.value;
  const observe = (value: Receive): Receive => message => {
    if ("id" in message && !("method" in message)) settle(message.id, "error" in message && extensionResult(message.error) ? { result: message.error.data } : message);
    value(message);
  };
  Object.defineProperty(transport, "onmessage", {
    configurable: true,
    get: () => (previous?.get ? previous.get.call(transport) : handler),
    set: (value: Receive | undefined) => {
      const wrapped = value && observe(value);
      if (previous?.set) previous.set.call(transport, wrapped);
      else handler = wrapped;
    },
  });
  // A request still unanswered when the transport closes never will be.
  const close = transport.close.bind(transport);
  transport.close = async () => {
    for (const id of [...pending.keys()]) settle(id, undefined, "transport");
    await close();
  };
  return transport;
}

// @cfworker/json-schema needs no eval; Ajv compiles code, which an MCP Apps host's CSP for a view forbids: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx#host-behavior
const drafts = new Map<string, SchemaDraft>([
  ["json-schema.org/draft/2020-12/schema", "2020-12"],
  ["json-schema.org/draft/2019-09/schema", "2019-09"],
  ["json-schema.org/draft-07/schema", "7"],
  ["json-schema.org/draft-06/schema", "7"],
]);

export const schemas: jsonSchemaValidator = {
  getValidator<T>(schema: object) {
    const $schema = "$schema" in schema ? schema.$schema : undefined;
    const draft = typeof $schema === "string" ? drafts.get($schema.replace(/^https?:\/\/|#$/g, "")) : "2020-12";
    if (!draft) throw new Error(`Unsupported JSON Schema dialect: ${$schema}`);
    const validator = new Validator(schema, draft);
    return value => {
      const { valid, errors } = validator.validate(value);
      return valid ? { valid, data: value as T, errorMessage: undefined } : { valid, data: undefined, errorMessage: errors.map(({ instanceLocation, error }) => `${instanceLocation}: ${error}`).join("; ") };
    };
  },
};

function connect(identity: Identity, callee: string, resolved: Endpoint, onclose?: (connection: Connection) => void, streamEnded?: StreamEnded): Connection {
  // Every client can be asked: a call answers with elicit, or the question reaches its caller. Servers must not assume a client answers: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
  // On 2026-07-28 the client sends these capabilities in every request's _meta: https://github.com/modelcontextprotocol/typescript-sdk/blob/fcef852f6cdafea07f36cf6fae69b37c8adf85be/packages/client/src/client/client.ts#L700-L711
  const client = new Client({ name: identity.name, version: identity.version }, { capabilities: { elicitation: { form: {}, url: {} }, extensions: { [EXTENSION]: { upload: {}, download: {} } } }, versionNegotiation: { mode: "auto" }, jsonSchemaValidator: schemas });
  const endpoint = new URL(resolved.endpoint);
  const transport = traced(acceptExtensionResults(new Transport(endpoint, { authProvider: resolved.authProvider, fetch: async (input, init) => {
    const headers = new Headers(init?.headers);
    if (String(input) === endpoint.href) connection.authorization = headers.get("authorization") ?? undefined;
    injectHeaders(headers);
    init = { ...init, headers };
    return (resolved.fetch ?? fetch)(input, init);
  }, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } }, streamEnded)), callee, appName(identity.name));
  transport.onclose = () => onclose?.(connection);
  const ready = client.connect(transport, { prior: resolved[PRIOR] }).catch(async (error: unknown) => {
    await transport.close();
    throw error;
  });
  const capabilities = resolved[PRIOR] ? async () => (await client.discover()).capabilities : async () => client.getServerCapabilities();
  const connection: Connection = { client, resolved, ready, capabilities, close: async () => {
    await transport.terminateSession().catch(() => {});
    await transport.close();
    await ready.catch(() => {});
  } };
  return connection;
}

export function createLink(identity: Identity, name: string, { binding, resolve }: { binding?: Binding; resolve?: (app: string) => EndpointBinding | undefined }): Link {
  if (binding && !("endpoint" in binding)) {
    const { session } = binding;
    return { name, hosted: true, session: async (options, run) => { options?.signal?.throwIfAborted(); return run(session); } };
  }
  const endpoint = (): Endpoint => {
    const resolved: Endpoint | undefined = binding ?? resolve?.(name);
    if (!resolved?.endpoint) throw new Error(`Dependency ${name} is unavailable. Provide a binding.`);
    return resolved;
  };
  let kept: Connection | undefined;
  const connected = async <T>(options: CallOptions | undefined, run: (connection: Connection) => Promise<T>): Promise<T> => {
    options?.signal?.throwIfAborted();
    const resolved = endpoint();
    const scoped = resolved.scoped === true;
    const active = scoped ? connect(identity, name, resolved) : (kept ??= connect(identity, name, resolved, closed => { if (kept === closed) kept = undefined; }));
    try {
      await untilAborted(active.ready, options?.signal);
      return await run(active);
    } finally { if (scoped) await active.close(); }
  };
  return {
    name,
    hosted: false,
    session: (options, run) => connected(options, connection => run(connection.client, connection)),
    connected,
    endpoint,
    connect: (resolved, streamEnded) => connect(identity, name, resolved, undefined, streamEnded),
    close: async () => { await kept?.close(); },
  };
}

export function sleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    const timer = setTimeout(done, signal?.aborted ? 0 : milliseconds);
    signal?.addEventListener("abort", done, { once: true });
  });
}

export function untilAborted<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason);
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
}

// The MCP client ends a request after 60 s unless given a timeout. A request without one waits as long as a timer can
// (2^31 - 1 ms, about 24.8 days). A request with one asks for progress, and progress restarts its timeout.
export function patient(options?: CacheableRequestOptions): CacheableRequestOptions {
  return options?.timeout === undefined
    ? { ...options, timeout: 2 ** 31 - 1 }
    : { onprogress: () => {}, resetTimeoutOnProgress: true, ...options };
}

export const unchecked = <T>(): StandardSchemaV1<unknown, T> => ({ "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: (value ?? {}) as T }) } });

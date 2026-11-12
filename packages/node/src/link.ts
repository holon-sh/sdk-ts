// How a runtime client reaches an app's server: through a hosted session, a connection kept open, or a connection for
// each call, and through connections of a caller's own for what it listens to.
import { Client, SdkHttpError, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CacheableRequestOptions, PriorDiscovery, StandardSchemaV1 } from "@modelcontextprotocol/client";
import { EXTENSION } from "./ext/files.js";
import { acceptUploadRequests } from "./ext/files.client.js";
import type { CallOptions } from "./protocol.js";
import type { Binding, Identity, ToolSession } from "./runtime.js";

/** A connection the runtime opened to an endpoint. */
export interface Connection {
  client: Client;
  resolved: Binding;
  /** The Authorization header sent to the endpoint, for file targets that include it. */
  authorization?: string;
  ready: Promise<void>;
  /** Whether the server answered any request on this connection. */
  answered: boolean;
  close(): Promise<void>;
}

/** What the operations of one app share: the ways they reach its server. */
export interface Link {
  readonly name: string;
  /** Runs requests over the app's session. `connection` is the runtime's own, which a hosted session does not have. */
  session<T>(options: CallOptions | undefined, run: (client: ToolSession, connection?: Connection) => Promise<T>): Promise<T>;
  /** The endpoint binding of the moment. `what` names the caller in the error when there is none. */
  endpoint(what: string): Binding;
  /** Opens a connection of the caller's own, so every notification on it is the caller's. */
  connect(binding: Binding): Connection;
  close(): Promise<void>;
}

// Environment-bound calls reuse the last server/discover result for the same endpoint and token instead of discovering
// the server on every call. A dependency keeps only its latest result, so a changed endpoint or token replaces it.
const DISCOVERY: unique symbol = Symbol("discovery");
const discovered = new Map<string, { key: string; prior: PriorDiscovery; expires: number }>();
const LEGACY_VERDICT_MS = 10 * 60 * 1000;

/** A binding the runtime connects to itself. */
type Endpoint = Binding & { [DISCOVERY]?: string };
/** Without an endpoint, a binding is served by the session hook or not at all. */
type Resolved = Endpoint | { endpoint?: undefined };

/** The binding of an app without one: <NAME>_MCP_URL, connected to for one call at a time. */
export function environment(name: string): Endpoint {
  const prefix = `${name.toUpperCase().replaceAll("-", "_")}_MCP_`;
  const endpoint = process.env[`${prefix}URL`];
  // <NAME>_MCP_TOKEN, when it is set, is sent as the bearer token.
  const token = process.env[`${prefix}TOKEN`];
  if (endpoint) return { endpoint, scoped: true, [DISCOVERY]: `${endpoint} ${token ?? ""}`, ...(token && { authProvider: { token: async () => token } }) };
  throw new Error(`Dependency ${name} is unavailable (${prefix}URL). Provide a binding or set the environment variable.`);
}

function connect(identity: Identity, resolved: Binding, prior?: PriorDiscovery, onclose?: (connection: Connection) => void): Connection {
  // Every client can be asked: a call answers with elicit, or the question reaches its caller. Servers must not assume a client answers: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
  // On 2026-07-28 the client sends these capabilities in every request's _meta: https://github.com/modelcontextprotocol/typescript-sdk/blob/fcef852f6cdafea07f36cf6fae69b37c8adf85be/packages/client/src/client/client.ts#L700-L711
  const client = new Client({ name: identity.name, version: identity.version }, { capabilities: { elicitation: { form: {}, url: {} }, extensions: { [EXTENSION]: { upload: {}, download: {} } } }, versionNegotiation: { mode: "auto" } });
  const endpoint = new URL(resolved.endpoint);
  const transport = acceptUploadRequests(new StreamableHTTPClientTransport(endpoint, { authProvider: resolved.authProvider, fetch: async (input, init) => {
    if (String(input) === endpoint.href) connection.authorization = new Headers(init?.headers).get("authorization") ?? undefined;
    const response = await (resolved.fetch ?? fetch)(input, init);
    connection.answered ||= response.ok;
    return response;
  }, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } }));
  transport.onclose = () => onclose?.(connection);
  const ready = client.connect(transport, { prior }).catch(async (error: unknown) => {
    await transport.close();
    throw error;
  });
  const connection: Connection = { client, resolved, ready, answered: false, close: async () => {
    await transport.terminateSession().catch(() => {});
    await transport.close();
    await ready.catch(() => {});
  } };
  return connection;
}

/**
 * The link of one app. Its binding, when it has one, is used as is; without one, `resolve` supplies it on every call.
 * `host` serves a binding the runtime does not connect to itself.
 */
export function createLink(identity: Identity, name: string, { binding, resolve, host }: { binding: unknown; resolve?: (app: string) => Binding | undefined; host?: ToolSession | undefined }): Link {
  const current = (): Resolved | undefined => (binding as Resolved | undefined) ?? resolve?.(name);
  let kept: Connection | undefined;
  const session = async <T>(options: CallOptions | undefined, run: (client: ToolSession, connection?: Connection) => Promise<T>): Promise<T> => {
    options?.signal?.throwIfAborted();
    if (host) return run(host);
    const resolved = current();
    if (!resolved?.endpoint) throw new Error(`Dependency ${name} is unavailable. Provide a binding.`);
    // Bindings marked scoped connect for one call at a time.
    const scoped = resolved.scoped === true;
    const key = resolved[DISCOVERY];
    const cached = discovered.get(name);
    const prior = key !== undefined && cached?.key === key && Date.now() < cached.expires ? cached.prior : undefined;
    const active = scoped ? connect(identity, resolved, prior) : (kept ??= connect(identity, resolved, undefined, closed => { if (kept === closed) kept = undefined; }));
    try {
      await untilAborted(active.ready, options?.signal);
      if (key !== undefined && !prior) {
        const discover = active.client.getDiscoverResult();
        discovered.set(name, { key, prior: discover ? { kind: "modern", discover } : { kind: "legacy" }, expires: discover ? Infinity : Date.now() + LEGACY_VERDICT_MS });
      }
      return await run(active.client, active);
    } catch (error) {
      // A server that no longer speaks the discovered protocol rejects the first request without running it.
      if (!prior || active.answered || !(SdkHttpError.isInstance(error) && error.status === 400)) throw error;
      discovered.delete(name);
      return session(options, run);
    } finally { if (scoped) await active.close(); }
  };
  return {
    name,
    session,
    endpoint(what) {
      const resolved = current();
      if (!resolved?.endpoint) throw new Error(`${what} requires an endpoint binding.`);
      return resolved;
    },
    connect: resolved => connect(identity, resolved),
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
    const timer = setTimeout(done, milliseconds);
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

// Answers outside the core protocol are trusted to be a T; event data is checked against the contract where it is read.
export const unchecked = <T>(): StandardSchemaV1<unknown, T> => ({ "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: (value ?? {}) as T }) } });

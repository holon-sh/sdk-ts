import { Client, isInputRequiredResult, SdkHttpError, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CacheableRequestOptions, CallToolRequest, CallToolRequestOptions, CallToolResult, InputRequiredResult, InputResponses, ListToolsRequest, ListToolsResult, PriorDiscovery, ReadResourceRequest, ReadResourceResult, Tool } from "@modelcontextprotocol/client";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";
import { EXTENSION } from "./ext/files.js";
import { acceptUploadRequests, downloads, isUploadRequest, prepare, upload } from "./ext/files.client.js";
import { ToolCallError } from "./protocol.js";
import type { AuthProvider, CallMetadata, CallOptions, EventOccurrence, EventType, SubscribeOptions, Subscription, ToolCallOptions, ToolClient, ToolResult } from "./protocol.js";

export { ToolCallError } from "./protocol.js";
export type { AuthProvider, CallOptions, CallMetadata, ElicitHandler, EventOccurrence, EventType, SubscribeOptions, Subscription, ToolCallOptions, ToolResult, ToolClient } from "./protocol.js";

/** Connection settings for an MCP endpoint. */
export interface Binding {
  /** Streamable HTTP MCP endpoint. */
  endpoint: URL | string;
  /** Authentication provider; use application-owned credentials. */
  authProvider?: AuthProvider;
  /** Custom fetch implementation, for example for an in-process transport. */
  fetch?: typeof fetch;
  /** Optional X-Holon-Installation-UID routing header. */
  installationUID?: string;
  /** Close the session after every call instead of keeping one connection open. */
  scoped?: boolean;
  /** Origins the server may name as file upload or download targets, e.g. "https://storage.example.com". Unset, any https origin on a globally reachable address is allowed; set, only these, which may also be http on loopback or have a non-global address. */
  fileOrigins?: string[];
}
/** Alias for an endpoint binding. */
export type EndpointBinding = Binding;
/** Calling application identity and its declared dependencies. */
export interface Identity { name: string; version: string; requires?: Record<string, { name?: string; version?: string }> }
/** Generation-time tool, JSON resource and event schemas. A null contract permits unvalidated callTool requests. */
export interface Contract {
  tools: Array<{ name: string; inputSchema: Record<string, unknown>; outputSchema?: Record<string, unknown> }>;
  resources?: Array<{ uri: string; outputSchema: Record<string, unknown> }>;
  events?: Array<{ name: string; inputSchema?: Record<string, unknown>; payloadSchema?: Record<string, unknown> }>;
}
/** Untyped client returned by the low-level runtime. Generated clients specialize its inputs, outputs, and resources. */
export type RuntimeClient = ToolClient<Record<string, Record<string, unknown>>, Record<string, unknown>, Record<string, unknown>>;
/** The subset of an MCP client a session must provide. A tool call may also resolve to the server's input_required question. */
export interface ToolSession {
  callTool(request: CallToolRequest["params"], options?: CallToolRequestOptions): Promise<CallToolResult | InputRequiredResult>;
  readResource(request: ReadResourceRequest["params"], options?: CacheableRequestOptions): Promise<ReadResourceResult>;
  listTools(params?: ListToolsRequest["params"], options?: CacheableRequestOptions): Promise<ListToolsResult>;
}
/** Optional validation, binding resolution, and host-session hooks. */
export interface CreateOptions<B = Binding> {
  /** JSON Schema validator factory. The default uses Ajv. A check may set errors, which a failure reports. */
  validator?: (schema: object) => { (value: unknown): boolean; errors?: unknown };
  /** Binding of an app created without explicit bindings; consulted on every call. */
  resolve?: (app: string) => Binding | undefined;
  /** Session for a binding the runtime does not connect to itself (anything without an endpoint). */
  session?: (app: string, binding: B) => ToolSession | undefined;
}

// Environment-bound calls reuse the last server/discover result for the same endpoint and token instead of discovering
// the server on every call. A dependency keeps only its latest result, so a changed endpoint or token replaces it.
const DISCOVERY = Symbol("discovery");
const discovered = new Map<string, { key: string; prior: PriorDiscovery; expires: number }>();
const LEGACY_VERDICT_MS = 10 * 60 * 1000;

/** A binding the runtime connects to itself. */
type Endpoint = Binding & { [DISCOVERY]?: string };
/** Without an endpoint, a binding is served by the session hook or not at all. */
type Resolved = Endpoint | { endpoint?: undefined };
/** Checks a value against one JSON Schema; errors describes the last failure. */
type Check = ReturnType<NonNullable<CreateOptions["validator"]>>;

// Object methods JavaScript calls implicitly; tools with these names stay reachable through callTool.
const reserved = new Set(["then", "toJSON", "toString", "valueOf", "toLocaleString"]);
// The MCP client's own Ajv, one engine per schema so contracts that reuse an $id stay apart. Contracts are module
// constants, so each schema compiles once however often createApps runs.
const checks = new WeakMap<object, Check>();

function defaultValidator(schema: object): Check {
  const cached = checks.get(schema);
  if (cached) return cached;
  const compiled = new AjvJsonSchemaValidator().getValidator(schema);
  const check: Check = value => {
    const { valid, errorMessage } = compiled(value);
    check.errors = errorMessage;
    return valid;
  };
  checks.set(schema, check);
  return check;
}

interface Connection {
  client: Client;
  resolved: Endpoint;
  authorization?: string;
  ready: Promise<void>;
  /** Whether the server answered any request on this connection. */
  answered: boolean;
  close(): Promise<void>;
}

function environment(name: string): Endpoint {
  const prefix = `${name.toUpperCase().replaceAll("-", "_")}_MCP_`;
  const endpoint = process.env[`${prefix}URL`];
  // Environment-bound dependencies connect for one call at a time, sending <NAME>_MCP_TOKEN as the bearer token when it is set.
  const token = process.env[`${prefix}TOKEN`];
  if (endpoint) return { endpoint, scoped: true, [DISCOVERY]: `${endpoint} ${token ?? ""}`, ...(token && { authProvider: { token: async () => token } }) };
  throw new Error(`Dependency ${name} is unavailable (${prefix}URL). Provide a binding or set the environment variable.`);
}

function validate(check: Check, value: unknown, label: string): void {
  if (!check(value)) throw new Error(`Invalid ${label}: ${JSON.stringify(check.errors)}`);
}

function sleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
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

function untilAborted<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason);
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
}

// The MCP client ends a request after 60 s unless given a timeout. A request without one waits as long as a timer can
// (2^31 - 1 ms, about 24.8 days). A request with one asks for progress, and progress restarts its timeout.
function patient(options?: CacheableRequestOptions): CacheableRequestOptions {
  return options?.timeout === undefined
    ? { ...options, timeout: 2 ** 31 - 1 }
    : { onprogress: () => {}, resetTimeoutOnProgress: true, ...options };
}

// Requests outside the core protocol are checked by their callers.
const anything = { "~standard": { version: 1 as const, vendor: "holon-sh", validate: (value: unknown) => ({ value: (value ?? {}) as any }) } };
// A stream that has said nothing for twice the longest heartbeat interval is dead: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#lifecycle
const QUIET = 60_000;
/** An occurrence as the server sends it, at the cursor after it. */
type Sent = EventOccurrence & { cursor?: string | null; _meta?: unknown };
/** One page of events/list. */
type Listed = { events?: EventType[]; nextCursor?: string };
/** What an events/poll answers. */
type Polled = { events?: Sent[]; cursor?: string | null; truncated?: boolean; hasMore?: boolean; nextPollMs?: number };
// A server's refusal ends a subscription: a client error, or an answer that the event type is gone, that access was
// lost, or that the request is no longer valid. Anything else is tried again from the cursor.
const refused = (error: any): boolean => error?.status >= 400 && error.status < 500 || error?.data?.status >= 400 && error.data.status < 500 || [-32602, -32023, -32024, -32026].includes(error?.code);

/** Construct only the explicitly bound dependencies. Unknown names throw; an empty binding map selects none. Used by generated createApps factories. */
export function bindApps<B = Binding>(identity: Identity, contracts: Record<string, Contract | null>, bindings: Record<string, B>, options?: CreateOptions<B>): Readonly<Record<string, RuntimeClient>> {
  const selected = Object.fromEntries(Object.keys(bindings).map((name): [string, Contract | null] => {
    if (!Object.hasOwn(contracts, name) && !Object.hasOwn(identity.requires ?? {}, name)) throw new Error("Unknown app binding: " + name);
    return [name, contracts[name] ?? null];
  }));
  return createApps(identity, selected, bindings, options);
}

/** Construct runtime clients from identity and contracts. Connections open lazily. Explicit and resolved endpoint bindings reuse one session unless scoped is true; <NAME>_MCP_URL bindings use one session per call. Close persistent clients on shutdown. Most callers use the generated clients. */
export function createApps<B = Binding>(identity: Identity, contracts: Record<string, Contract | null>, bindings?: Record<string, B>, options?: CreateOptions<B>): Readonly<Record<string, RuntimeClient>> {
  const { validator = defaultValidator, resolve = environment, session: hosted } = options ?? {};
  const apps: Record<string, RuntimeClient> = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members: Record<string, Contract | null> = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    // Without explicit bindings, the resolve hook supplies the binding on every call.
    const current = (): Resolved | undefined => (binding as Resolved | undefined) ?? (bindings ? undefined : resolve(name));
    let connection: Connection | undefined;
    const connect = (resolved: Endpoint, prior?: PriorDiscovery): Connection => {
      // Every client can be asked: a call answers with elicit, or the question reaches its caller. Servers must not assume a client answers: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
      // On 2026-07-28 the client sends these capabilities in every request's _meta: https://github.com/modelcontextprotocol/typescript-sdk/blob/fcef852f6cdafea07f36cf6fae69b37c8adf85be/packages/client/src/client/client.ts#L700-L711
      const client = new Client({ name: identity.name, version: identity.version }, { capabilities: { elicitation: { form: {}, url: {} }, extensions: { [EXTENSION]: { upload: {}, download: {} } } }, versionNegotiation: { mode: "auto" } });
      const endpoint = new URL(resolved.endpoint);
      const transport = acceptUploadRequests(new StreamableHTTPClientTransport(endpoint, { authProvider: resolved.authProvider, fetch: async (input, init) => {
        if (String(input) === endpoint.href) current.authorization = new Headers(init?.headers).get("authorization") ?? undefined;
        const response = await (resolved.fetch ?? fetch)(input, init);
        current.answered ||= response.ok;
        return response;
      }, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } }));
      transport.onclose = () => { if (connection === current) connection = undefined; };
      const ready = client.connect(transport, { prior }).catch(async (error: unknown) => {
        await transport.close();
        throw error;
      });
      const current: Connection = { client, resolved, ready, answered: false, close: async () => {
        await transport.terminateSession().catch(() => {});
        await transport.close();
        await ready.catch(() => {});
      } };
      return current;
    };
    // The session hook serves bindings the runtime does not connect to itself.
    const host = binding ? hosted?.(name, binding) : undefined;
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
      const active = scoped ? connect(resolved, prior) : (connection ??= connect(resolved));
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
    const tools: Record<string, RuntimeClient["tools"][string]> = Object.create(null);
    const definitions = new Map<string, { definition: Contract["tools"][number]; output?: Check }>((contract?.tools ?? []).map(definition => [definition.name, { definition }]));
    const callTool = async (request: CallMetadata & { name: string; arguments?: Record<string, unknown> }, { elicit, ...options }: ToolCallOptions = {}): Promise<ToolResult<unknown>> => {
      const tool = definitions.get(request.name);
      if (!tool && contract) throw new Error(`Unknown tool ${name}.${request.name}.`);
      // A contract's tool is the tool as its server listed it.
      const sent = { ...patient(options), allowInputRequired: true, ...(tool && { toolDefinition: { ...tool.definition, outputSchema: undefined } as Tool }) };
      const label = `${name}.${request.name}`;
      const result = await session(options, async (client, connection) => {
        const { arguments: args, files } = await prepare(request.arguments, {
          label, connection,
          schema: async () => tool?.definition.inputSchema ?? (await client.listTools(undefined, patient(options))).tools.find(({ name }) => name === request.name)?.inputSchema,
        });
        // The SDK's request type leaves out the continuation fields the protocol carries.
        let next: typeof request = files.size ? { ...request, arguments: args } : request;
        let uploaded = false;
        for (let round = 0; ;) {
          let result: CallToolResult | InputRequiredResult;
          try {
            result = await client.callTool(next, sent);
          } catch (error) {
            if (connection && isUploadRequest(error)) {
              if (uploaded) throw new Error(`${label}: the server asked for a second upload; the tool did not run.`);
              const requestState = await upload(error.data, files, connection, options.signal, label);
              uploaded = true;
              const { inputResponses, ...retry } = next;
              next = { ...retry, requestState };
              continue;
            }
            if (uploaded) throw new Error(`${label}: the outcome is unknown; the tool may have run (${(error as { message?: unknown } | null | undefined)?.message ?? error}).`, { cause: error });
            throw error;
          }
          // A server may keep asking, so answering stops after ten rounds, the MCP clients' own limit, and the last question reaches the caller.
          if (!elicit || !isInputRequiredResult(result) || round++ === 10) return connection ? downloads(result, connection) : result;
          const inputResponses: InputResponses = {};
          for (const [key, question] of Object.entries(result.inputRequests ?? {})) {
            // Every client declares elicitation alone, so it answers nothing else and such a question reaches the caller.
            if (question.method !== "elicitation/create") return result;
            inputResponses[key] = await elicit(question.params);
          }
          next = { ...next, inputResponses, requestState: result.requestState };
        }
      });
      if (isInputRequiredResult(result)) return result;
      // The server validates arguments; the client checks the output against the contract it was compiled against.
      if (!result.isError && tool?.definition.outputSchema) {
        validate(tool.output ??= validator(tool.definition.outputSchema), result.structuredContent, `structured output from ${name}.${request.name}`);
      }
      // isError tells ToolResult's success variant from its error variant.
      return { ...result, resultType: "complete" } as ToolResult<unknown>;
    };
    const listTools = (options?: CallOptions) => session(options, client => client.listTools(undefined, patient(options)));
    for (const tool of contract?.tools ?? []) if (!reserved.has(tool.name)) {
      tools[tool.name] = async (input, options) => {
        const result = await callTool({ name: tool.name, arguments: input }, options);
        if (result.resultType === "input_required" || result.isError) throw new ToolCallError(name, tool.name, result);
        return tool.outputSchema ? result.structuredContent : result;
      };
    }
    const resources: Record<string, RuntimeClient["resources"][string]> = Object.create(null);
    for (const resource of contract?.resources ?? []) {
      let valid: Check | undefined;
      const parse = (result: ReadResourceResult): unknown => {
        // Contracted resources are JSON in their first text content.
        const [content] = result.contents;
        if (!content || !("text" in content)) throw new Error(`Invalid contents from ${name} ${resource.uri}: no text content`);
        const value = JSON.parse(content.text);
        valid ??= validator(resource.outputSchema);
        validate(valid, value, `contents from ${name} ${resource.uri}`);
        return value;
      };
      const read = async (options?: CallOptions) => parse(await session(options, client => client.readResource({ uri: resource.uri }, patient(options))));
      const watch = async (onChange: (value: unknown) => void | Promise<void>, { signal }: { signal?: AbortSignal } = {}) => {
        const resolved = current();
        if (!resolved?.endpoint) throw new Error(`Watching ${name} ${resource.uri} requires an endpoint binding.`);
        // An abort ends the wait between attempts early instead of failing it.
        for (let established = false; !signal?.aborted; await sleep(1000, signal)) {
          const current = connect(resolved);
          let failure: unknown;
          try {
            await untilAborted(current.ready, signal);
            const { client } = current;
            if (!client.getServerCapabilities()?.resources?.subscribe) throw new Error(`${name} does not advertise resource subscriptions.`);
            let reads = Promise.resolve();
            const refresh = () => (reads = reads.then(async () => onChange(parse(await client.readResource({ uri: resource.uri }, patient({ signal, cacheMode: "bypass" })))))
              .catch(error => { failure ??= error; return current.close(); }));
            client.setNotificationHandler("notifications/resources/updated", ({ params }) => { if (params.uri === resource.uri) void refresh(); });
            const subscription = await client.listen({ resourceSubscriptions: [resource.uri] }, { signal });
            if (!subscription.honoredFilter.resourceSubscriptions?.includes(resource.uri)) throw new Error(`${name} did not accept a subscription to ${resource.uri}.`);
            established = true;
            await refresh();
            await subscription.closed;
          } catch (error) {
            failure ??= error;
          } finally {
            await current.close();
          }
          if (signal?.aborted) return;
          if (failure && !established) throw failure;
        }
      };
      resources[resource.uri] = Object.freeze({ read, watch });
    }
    // MCP Events, the draft extension: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md
    // Its requests go over the runtime's own connection, which a hosted session does not have.
    const connected = <T>(options: CallOptions | undefined, run: (client: Client) => Promise<T>) => session(options, (_, connection) => {
      if (!connection) throw new Error(`MCP Events of ${name} require an endpoint binding.`);
      return run(connection.client);
    });
    const list = (options?: CallOptions) => connected(options, async client => {
      const events: EventType[] = [];
      for (let cursor: string | undefined; ;) {
        const page = await client.request({ method: "events/list", params: { ...(cursor && { cursor }) } }, anything, patient(options)) as Listed;
        events.push(...page.events ?? []);
        if (!(cursor = page.nextCursor)) return events;
      }
    });
    const subscribe = async (event: string, args: unknown = {}, { signal, onGap, maxAgeMs, reconnect = true, ...options }: SubscribeOptions = {}): Promise<Subscription> => {
      const resolved = current();
      if (!resolved?.endpoint) throw new Error(`Subscribing to ${name} ${event} requires an endpoint binding.`);
      const offered = (await list(signal && { signal })).find(type => type.name === event)?.delivery;
      if (!offered) throw new Error(`${name} has no event ${event}.`);
      // Push hears of an event at once, and poll works wherever a request does. Webhook delivery is not supported.
      const delivery = options.delivery ?? (["push", "poll"] as const).find(mode => offered.includes(mode));
      // The sketch's NoCompatibleDeliveryMode: none of the modes the server offers is one this client uses.
      if (!delivery || !offered.includes(delivery)) throw Object.assign(new Error(`${name} does not deliver ${event} by ${delivery ?? "poll or push"}.`), { name: "NoCompatibleDeliveryMode" });
      const cancelled = new AbortController();
      const ended = signal ? AbortSignal.any([signal, cancelled.signal]) : cancelled.signal;
      let cursor = options.cursor ?? null;
      const queue: EventOccurrence[] = [];
      const seen = new Set<string>();
      let wake = () => {};
      let done = false;
      let failure: unknown;
      // An absent cursor is a null one, and a null one is never resumed from.
      const reach = (next: string | null | undefined, truncated?: boolean) => {
        cursor = next ?? null;
        if (truncated) onGap?.();
      };
      // The client checks an event's data against the contract it was compiled against, as it does a tool's output.
      const expected = contract?.events?.find(type => type.name === event)?.payloadSchema;
      let valid: Check | undefined;
      const deliver = ({ cursor: _, _meta, ...occurrence }: Sent) => {
        if (seen.has(occurrence.eventId)) return;
        seen.add(occurrence.eventId);
        if (seen.size > 1024) seen.delete(seen.values().next().value!);
        if (expected) validate(valid ??= validator(expected), occurrence.data, `data of ${name} ${event}`);
        queue.push(occurrence);
        wake();
      };
      const request = { name: event, arguments: args, ...(maxAgeMs !== undefined && { maxAgeMs }) };
      let confirmed = false;
      const established = Promise.withResolvers<void>();
      const confirm = () => { confirmed = true; established.resolve(); };
      const poll = async () => {
        while (!ended.aborted) {
          let wait = 1000;
          try {
            const result = await connected({ signal: ended }, client => client.request({ method: "events/poll", params: { ...request, cursor } }, anything, patient({ signal: ended })) as Promise<Polled>);
            try { for (const occurrence of result.events ?? []) deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
            reach(result.cursor, result.truncated);
            confirm();
            // A server that asks for a tight loop is not obeyed.
            wait = result.hasMore ? 0 : Math.max(1000, result.nextPollMs ?? 0);
          } catch (error) {
            if (ended.aborted) return;
            if (!confirmed || !reconnect || refused(error)) throw error;
          }
          await sleep(wait, ended);
        }
      };
      const stream = async () => {
        while (!ended.aborted) {
          let wait = 1000;
          const quiet = new AbortController();
          // A stream that fails, ends without its answer or goes quiet is lost.
          let lost: unknown;
          const lose = (error: unknown = new Error(`Lost the connection to ${name} for ${event}.`)) => { lost = error; quiet.abort(); };
          // The MCP client keeps waiting for the answer of a request whose stream has ended, so the end is watched for here.
          // Only the stream's own response is watched: a 2025 server answers its initialization as a stream too.
          const watched: typeof fetch = async (input, init) => {
            const response = await (resolved.fetch ?? fetch)(input, init);
            const streaming = typeof init?.body === "string" && init.body.includes('"method":"events/stream"');
            if (!streaming || !response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) return response;
            const reader = response.body.getReader();
            const body = new ReadableStream({
              pull: controller => reader.read().then(({ done, value }) => {
                if (!done) return controller.enqueue(value);
                controller.close();
                // The answer, when the stream ended with one, is handled first.
                setTimeout(() => lose());
              }, error => { controller.error(error); lose(error); }),
              cancel: reason => reader.cancel(reason),
            });
            return new Response(body, response);
          };
          // Each stream has its own connection, so every event notification on it is this subscription's.
          const connection = connect({ ...resolved, fetch: watched });
          let timer: ReturnType<typeof setTimeout> | undefined;
          const heard = () => {
            clearTimeout(timer);
            timer = setTimeout(() => lose(), QUIET);
          };
          let terminated: { code?: number; message?: string; data?: unknown } | undefined;
          try {
            await untilAborted(connection.ready, ended);
            const on = (method: string, handle: (params: any) => void) => connection.client.setNotificationHandler(`notifications/events/${method}`, { params: anything }, params => { heard(); handle(params); });
            on("active", ({ cursor: next, truncated }) => { reach(next, truncated); confirm(); });
            on("event", occurrence => {
              wait = 0;
              try { deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
              reach(occurrence.cursor);
            });
            on("heartbeat", ({ cursor: next }) => reach(next));
            // The server recovers from an error by itself, and the stream stays open.
            on("error", () => {});
            on("terminated", ({ error }) => { terminated = error; quiet.abort(); });
            heard();
            await connection.client.request({ method: "events/stream", params: { ...request, cursor } }, anything, { signal: AbortSignal.any([ended, quiet.signal]), timeout: 2 ** 31 - 1 });
          } catch (error) {
            if (!terminated && !ended.aborted && (!confirmed || !reconnect || refused(error))) throw lost ?? error;
          } finally {
            clearTimeout(timer);
            await connection.close();
          }
          if (terminated) throw Object.assign(new Error(`${name} ended the subscription to ${event}: ${terminated.message}`), { code: terminated.code, data: terminated.data });
          await sleep(wait, ended);
        }
      };
      void (delivery === "push" ? stream() : poll())
        .catch(error => { failure ??= error; })
        .finally(() => { done = true; wake(); established.reject(failure ?? ended.reason); });
      await established.promise;
      return {
        delivery,
        get cursor() { return cursor; },
        cancel: () => cancelled.abort(),
        [Symbol.asyncIterator]: () => ({
          next: async (): Promise<IteratorResult<EventOccurrence>> => {
            while (!queue.length && !done) await new Promise<void>(resolve => { wake = resolve; });
            const value = queue.shift();
            if (value) return { value, done: false };
            if (failure) throw failure;
            return { value: undefined, done: true };
          },
          return: async (): Promise<IteratorResult<EventOccurrence>> => { cancelled.abort(); return { value: undefined, done: true }; },
        }),
      };
    };
    // Generated clients narrow callTool to their contract's tools and outputs, which validation upholds.
    apps[name] = Object.freeze({ callTool: callTool as RuntimeClient["callTool"], listTools, ext: Object.freeze({ events: Object.freeze({ list, subscribe: subscribe as RuntimeClient["ext"]["events"]["subscribe"] }) }), resources: Object.freeze(resources), close: async () => { await connection?.close(); }, tools: Object.freeze(tools) });
  }
  return Object.freeze(apps);
}

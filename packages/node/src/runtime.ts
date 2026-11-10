import { Client, isInputRequiredResult, SdkHttpError, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import type { CacheableRequestOptions, CallToolResult, DiscoverResult, InputRequiredResult, InputResponses, ReadResourceResult, StandardSchemaV1, StreamableHTTPClientTransportOptions, Tool } from "@modelcontextprotocol/client";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";
import { setTimeout as sleep } from "node:timers/promises";
import { ToolCallError } from "./protocol.js";
import type { AuthProvider, CallMetadata, CallOptions, EventOccurrence, EventType, SubscribeOptions, Subscription, ToolCallOptions, ToolClient, ToolResult } from "./protocol.js";
import type { WebhookReceiver } from "./webhooks.js";

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
/** The subset of an MCP client a session must provide. */
export interface ToolSession {
  callTool(request: { name: string; arguments?: Record<string, unknown> }, options?: Record<string, unknown>): Promise<any>;
  readResource(request: { uri: string }, options?: Record<string, unknown>): Promise<any>;
  listTools(params?: undefined, options?: Record<string, unknown>): Promise<any>;
}
/** Optional validation, binding resolution, and host-session hooks. */
export interface CreateOptions<B = Binding> {
  /** JSON Schema validator factory. The default uses Ajv. A check may set errors, which a failure reports. */
  validator?: (schema: object) => { (value: unknown): boolean; errors?: unknown };
  /** Binding of an app created without explicit bindings; consulted on every call. */
  resolve?: (app: string) => Binding | undefined;
  /** Session for a binding the runtime does not connect to itself (anything without an endpoint). */
  session?: (app: string, binding: B) => ToolSession | undefined;
  /** Where servers deliver events by webhook: the URL the receiver is mounted at, and the receiver. */
  webhook?: { url: URL | string; receiver: WebhookReceiver };
}

// Environment-bound calls reuse the last server/discover result for the same endpoint and token instead of discovering
// the server on every call. A dependency keeps only its latest result, so a changed endpoint or token replaces it.
const DISCOVERY = Symbol("discovery");
const discovered = new Map<string, { key: string; discover: DiscoverResult | undefined }>();

/** A binding the runtime connects to itself. */
type Endpoint = Binding & { [DISCOVERY]?: string };
/** Without an endpoint, a binding is served by the session hook or not at all. */
type Resolved = Endpoint | { endpoint?: undefined };
/** The MCP client calls a session serves, whether the runtime's own client or a host's. */
type Session = Pick<Client, "callTool" | "readResource" | "listTools">;
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
  ready: Promise<void>;
  /** Whether the server answered any request on this connection. */
  answered: boolean;
  close(): Promise<void>;
}

function environment(identity: Identity, name: string): Endpoint | undefined {
  if (!Object.hasOwn(identity.requires ?? {}, name)) return undefined;
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
function anything<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "holon-sh", validate: value => ({ value: (value ?? {}) as T }) } };
}
// A stream that has said nothing for twice the longest heartbeat interval is dead: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#lifecycle
const QUIET = 60_000;
// The protocol's refusals, which end a subscription: an invalid request, an event type that is gone, lost access,
// and a delivery mode not offered.
const REFUSALS = [-32602, -32023, -32024, -32026];

/** What the Events extension's requests and notifications carry, as the sketch defines them. */
interface Delivered extends EventOccurrence { cursor?: string | null; _meta?: unknown }
interface Polled { events?: Delivered[]; cursor?: string | null; truncated?: boolean; hasMore?: boolean; nextPollMs?: number }
interface Subscribed { id: string; cursor?: string | null; truncated?: boolean; refreshBefore?: string | null }
interface Ended { code?: number; message?: string; data?: unknown }
interface Envelope extends Partial<Delivered> { type?: string; error?: Ended }

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
  const { validator = defaultValidator, resolve = (name: string) => environment(identity, name), session: hosted, webhook } = options ?? {};
  const apps: Record<string, RuntimeClient> = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members: Record<string, Contract | null> = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    // Without explicit bindings, the resolve hook supplies the binding on every call.
    const current = (): Resolved | undefined => (binding as Resolved | undefined) ?? (bindings ? undefined : resolve(name));
    let connection: Connection | undefined;
    const connect = (resolved: Endpoint, discover?: DiscoverResult): Connection => {
      // Every client can be asked: a call answers with elicit, or the question reaches its caller. Servers must not assume a client answers: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr#server-requirements-basic-workflow
      // On 2026-07-28 the client sends these capabilities in every request's _meta: https://github.com/modelcontextprotocol/typescript-sdk/blob/fcef852f6cdafea07f36cf6fae69b37c8adf85be/packages/client/src/client/client.ts#L700-L711
      const client = new Client({ name: identity.name, version: identity.version }, { capabilities: { elicitation: { form: {}, url: {} } }, versionNegotiation: { mode: "auto" } });
      // The public AuthProvider names the shapes the transport accepts without restating every OAuth member.
      const transport = new StreamableHTTPClientTransport(new URL(resolved.endpoint), { authProvider: resolved.authProvider as StreamableHTTPClientTransportOptions["authProvider"], fetch: async (input, init) => {
        const response = await (resolved.fetch ?? fetch)(input, init);
        current.answered ||= response.ok;
        return response;
      }, requestInit: { credentials: "include", redirect: "error", headers: resolved.installationUID ? { "X-Holon-Installation-UID": resolved.installationUID } : {} } });
      transport.onclose = () => { if (connection === current) connection = undefined; };
      const ready = client.connect(transport, discover && { prior: { kind: "modern", discover } }).catch(async (error: unknown) => {
        await transport.close();
        throw error;
      });
      const current: Connection = { client, ready, answered: false, close: async () => {
        await transport.close();
        await ready.catch(() => {});
      } };
      return current;
    };
    // The session hook serves bindings the runtime does not connect to itself.
    const host = binding ? hosted?.(name, binding) : undefined;
    const session = async <T>(options: CallOptions | undefined, run: (client: Session) => Promise<T>): Promise<T> => {
      options?.signal?.throwIfAborted();
      if (host) return run(host);
      const resolved = current();
      if (!resolved) throw new Error(Object.hasOwn(identity.requires ?? {}, name)
        ? `Dependency ${name} is unavailable. Provide a binding.`
        : `Dependency ${name} is not declared by this application.`);
      if (!resolved.endpoint) throw new Error(`Dependency ${name} binding has no endpoint.`);
      // Bindings marked scoped connect for one call at a time.
      const scoped = resolved.scoped === true;
      const key = resolved[DISCOVERY];
      const cached = discovered.get(name);
      const prior = key !== undefined && cached?.key === key ? cached.discover : undefined;
      const active = scoped ? connect(resolved, prior) : (connection ??= connect(resolved));
      try {
        await untilAborted(active.ready, options?.signal);
        if (key !== undefined) discovered.set(name, { key, discover: active.client.getDiscoverResult() });
        return await run(active.client);
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
      const result = await session(options, async client => {
        let result: CallToolResult | InputRequiredResult = await client.callTool(request, sent);
        // A server may keep asking, so answering stops after ten rounds, the MCP clients' own limit, and the last question reaches the caller.
        for (let round = 0; elicit && isInputRequiredResult(result) && round < 10; round++) {
          const inputResponses: InputResponses = {};
          for (const [key, question] of Object.entries(result.inputRequests ?? {})) {
            // Every client declares elicitation alone, so it answers nothing else and such a question reaches the caller.
            if (question.method !== "elicitation/create") return result;
            inputResponses[key] = await elicit(question.params);
          }
          // The SDK's request type leaves out the continuation fields the protocol carries.
          const next: typeof request = { ...request, inputResponses, requestState: result.requestState };
          result = await client.callTool(next, sent);
        }
        return result;
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
        for (let established = false; !signal?.aborted; await sleep(1000, undefined, { signal }).catch(() => {})) {
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
    // Its requests need the runtime's own connection, which a host's session does not give.
    const request = <T>(client: Session, method: string, params: Record<string, unknown>, options?: CacheableRequestOptions): Promise<T> => {
      if (!("request" in client)) throw new Error(`Events of ${name} need an endpoint binding.`);
      return (client as Client).request({ method, params }, anything<T>(), options);
    };
    const list = (options?: CallOptions) => session(options, async client => {
      const events: EventType[] = [];
      for (let cursor: string | undefined; ;) {
        const page = await request<{ events?: EventType[]; nextCursor?: string }>(client, "events/list", { ...(cursor && { cursor }) }, patient(options));
        events.push(...page.events ?? []);
        if (!(cursor = page.nextCursor)) return events;
      }
    });
    const subscribe = async (event: string, args: Record<string, unknown> = {}, { signal, onGap, maxAgeMs, ...options }: SubscribeOptions = {}): Promise<Subscription> => {
      const resolved = current();
      if (!resolved?.endpoint) throw new Error(`Subscribing to ${name} ${event} requires an endpoint binding.`);
      const endpoint: Endpoint = resolved;
      const offered = (await list({ signal })).find(type => type.name === event)?.delivery;
      if (!offered) throw new Error(`${name} has no event ${event}.`);
      // A webhook ties up no connection, push hears of an event at once, and poll works wherever a request does: https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md#delivery-mode-selection
      const delivery = options.delivery ?? (webhook && offered.includes("webhook") ? "webhook" : offered.includes("push") ? "push" : offered.includes("poll") ? "poll" : undefined);
      if (!delivery || !offered.includes(delivery)) throw new Error(`${name} does not deliver ${event} by ${delivery ?? "poll or push"}.`);
      if (delivery === "webhook" && !webhook) throw new Error(`Webhook delivery of ${name} ${event} needs the webhook option of createApps.`);
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
      const deliver = ({ cursor: _, _meta, ...occurrence }: Delivered) => {
        if (seen.has(occurrence.eventId)) return;
        seen.add(occurrence.eventId);
        const oldest = seen.values().next();
        if (seen.size > 1024 && !oldest.done) seen.delete(oldest.value);
        if (expected) validate(valid ??= validator(expected), occurrence.data, `data of ${name} ${event}`);
        queue.push(occurrence);
        wake();
      };
      const asked = { name: event, arguments: args, ...(maxAgeMs !== undefined && { maxAgeMs }) };
      let confirmed = false;
      let established!: { resolve(): void; reject(reason: unknown): void };
      const active = new Promise<void>((resolve, reject) => { established = { resolve: () => { confirmed = true; resolve(); }, reject }; });
      // A server's refusal ends the subscription. Anything else is tried again from the cursor.
      const refused = (error: unknown) => {
        const status = SdkHttpError.isInstance(error) ? error.status : undefined;
        const code = (error as Ended | undefined)?.code;
        return status !== undefined && status >= 400 && status < 500 || code !== undefined && REFUSALS.includes(code);
      };
      // An abort ends a wait between attempts early instead of failing it.
      const pause = (milliseconds: number, until: AbortSignal) => sleep(milliseconds, undefined, { signal: until }).catch(() => {});
      const ending = (error: Ended) => Object.assign(new Error(`${name} ended the subscription to ${event}: ${error.message}`), { code: error.code, data: error.data });
      const poll = async () => {
        while (!ended.aborted) {
          let wait = 1000;
          try {
            const result = await session({ signal: ended }, client => request<Polled>(client, "events/poll", { ...asked, cursor }, patient({ signal: ended })));
            try { for (const occurrence of result.events ?? []) deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
            reach(result.cursor, result.truncated);
            established.resolve();
            // A server that asks for a tight loop is not obeyed.
            wait = result.hasMore ? 0 : Math.max(1000, result.nextPollMs ?? 0);
          } catch (error) {
            if (ended.aborted) return;
            if (!confirmed || refused(error)) throw error;
          }
          await pause(wait, ended);
        }
      };
      const stream = async () => {
        while (!ended.aborted) {
          const quiet = new AbortController();
          // The MCP client keeps waiting for the answer of a request whose stream has ended, so the end is watched for here.
          const watched: typeof fetch = async (input, init) => {
            const response = await (endpoint.fetch ?? fetch)(input, init);
            if (!response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) return response;
            const reader = response.body.getReader();
            const body = new ReadableStream<Uint8Array>({
              pull: controller => reader.read().then(({ done, value }) => {
                if (!done) return controller.enqueue(value);
                controller.close();
                // The answer, when the stream ended with one, is handled first.
                setTimeout(() => quiet.abort());
              }, error => { controller.error(error); quiet.abort(); }),
              cancel: reason => reader.cancel(reason),
            });
            return new Response(body, response);
          };
          // Each stream has its own connection, so every event notification on it is this subscription's.
          const connection = connect({ ...endpoint, fetch: watched });
          let timer: ReturnType<typeof setTimeout> | undefined;
          const heard = () => {
            clearTimeout(timer);
            timer = setTimeout(() => quiet.abort(), QUIET);
          };
          let terminated: Ended | undefined;
          try {
            await untilAborted(connection.ready, ended);
            const on = <P>(method: string, handle: (params: P) => void) => connection.client.setNotificationHandler(`notifications/events/${method}`, { params: anything<P>() }, params => { heard(); handle(params); });
            on<{ cursor?: string | null; truncated?: boolean }>("active", ({ cursor: next, truncated }) => { reach(next, truncated); established.resolve(); });
            on<Delivered>("event", occurrence => {
              try { deliver(occurrence); } catch (error) { failure = error; return cancelled.abort(); }
              reach(occurrence.cursor);
            });
            on<{ cursor?: string | null }>("heartbeat", ({ cursor: next }) => reach(next));
            // The server recovers from an error by itself, and the stream stays open.
            on("error", () => {});
            on<{ error: Ended }>("terminated", ({ error }) => { terminated = error; quiet.abort(); });
            heard();
            await connection.client.request({ method: "events/stream", params: { ...asked, cursor } }, anything(), { signal: AbortSignal.any([ended, quiet.signal]), timeout: 2 ** 31 - 1 });
          } catch (error) {
            if (!terminated && !ended.aborted && (!confirmed || refused(error))) throw error;
          } finally {
            clearTimeout(timer);
            await connection.close();
          }
          if (terminated) throw ending(terminated);
          await pause(1000, ended);
        }
      };
      // The server POSTs to the application's receiver, which hands this subscription its deliveries. The subscription
      // lives as long as it is refreshed, and is let go of at once when it ends.
      const hook = async ({ url, receiver }: NonNullable<typeof webhook>) => {
        let terminated: Ended | undefined;
        const stopped = new AbortController();
        const listening = receiver.listen(body => {
          const message = body as Envelope | undefined;
          if (message?.type === "gap") return reach(message.cursor, true);
          if (message?.type === "terminated") { terminated = message.error ?? {}; return stopped.abort(); }
          if (message?.type || !message) return;
          try { deliver(message as Delivered); } catch (error) { failure = error; return cancelled.abort(); }
          reach(message.cursor);
        });
        const until = AbortSignal.any([ended, stopped.signal]);
        const target = { name: event, arguments: args, delivery: { mode: "webhook", url: String(url) } };
        // Failed refreshes are tried again sooner than the grant ends, a little later each time.
        let retry = 1000;
        try {
          for (let wait = 0; !until.aborted; await pause(wait, until)) {
            try {
              const result = await session({ signal: until }, client => request<Subscribed>(client, "events/subscribe", { ...asked, ...target, delivery: { ...target.delivery, secret: listening.secret }, cursor }, patient({ signal: until })));
              listening.bind(result.id);
              reach(result.cursor, result.truncated);
              established.resolve();
              // Refreshed well before the grant ends. A grant without expiry is still refreshed now and then, for its cursor and status.
              wait = result.refreshBefore == null ? 60 * 60_000 : Math.max(10, (Date.parse(result.refreshBefore) - Date.now()) * 0.8);
              retry = 1000;
            } catch (error) {
              if (until.aborted) break;
              // The server refusing the subscription ends it, as does a callback it cannot reach. Anything else, a
              // failure inside the server too, is tried again.
              if (!confirmed || refused(error) || (error as Ended | undefined)?.code === -32027) throw error;
              wait = retry;
              retry = Math.min(retry * 2, 60_000);
            }
          }
        } finally {
          if (listening.close() && !terminated) await session({}, client => request(client, "events/unsubscribe", target, patient({}))).catch(() => {});
        }
        if (terminated) throw ending(terminated);
      };
      void (delivery === "push" ? stream() : delivery === "webhook" ? hook(webhook!) : poll())
        .catch(error => { failure ??= error; })
        .finally(() => { done = true; wake(); established.reject(failure ?? ended.reason); });
      await active;
      return {
        delivery: delivery as Subscription["delivery"],
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
    // Generated clients narrow callTool to their contract's tools and outputs, which validation upholds, and
    // subscribe to their contract's events.
    apps[name] = Object.freeze({ callTool: callTool as RuntimeClient["callTool"], listTools, events: Object.freeze({ list, subscribe: subscribe as RuntimeClient["events"]["subscribe"] }), resources: Object.freeze(resources), close: async () => { await connection?.close(); }, tools: Object.freeze(tools) });
  }
  return Object.freeze(apps);
}

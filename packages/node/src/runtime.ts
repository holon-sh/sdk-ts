import { isInputRequiredResult } from "@modelcontextprotocol/client";
import type { CacheableRequestOptions, CallToolRequest, CallToolRequestOptions, CallToolResult, InputRequiredResult, InputResponses, ListToolsRequest, ListToolsResult, ReadResourceRequest, ReadResourceResult, Tool } from "@modelcontextprotocol/client";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/client/validators/ajv";
import { events } from "./ext/events.client.js";
import { downloads, isUploadRequest, prepare, upload } from "./ext/files.client.js";
import { createLink, environment, patient, sleep, untilAborted, type Link } from "./link.js";
import { ToolCallError } from "./protocol.js";
import type { AuthProvider, CallMetadata, CallOptions, ToolCallOptions, ToolClient, ToolResult } from "./protocol.js";

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

/** Checks a value against one JSON Schema; errors describes the last failure. */
type Check = ReturnType<NonNullable<CreateOptions["validator"]>>;
/** A check of values against a contract's schema, compiled when it is first used; `label` names what fails it. */
type Expect = (schema: object, label: string) => (value: unknown) => void;

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
  const expect: Expect = (schema, label) => {
    let check: Check | undefined;
    return value => {
      check ??= validator(schema);
      if (!check(value)) throw new Error(`Invalid ${label}: ${JSON.stringify(check.errors)}`);
    };
  };
  const apps: Record<string, RuntimeClient> = Object.create(null);
  // Without explicit bindings, every declared dependency gets a client; those without a contract are untyped.
  const members: Record<string, Contract | null> = { ...(bindings ? {} : Object.fromEntries(Object.keys(identity.requires ?? {}).map(name => [name, null]))), ...contracts };
  for (const [name, contract] of Object.entries(members)) {
    const binding = bindings?.[name];
    // Without explicit bindings, the resolve hook supplies the binding on every call. The session hook serves bindings
    // the runtime does not connect to itself.
    const link = createLink(identity, name, { binding, resolve: bindings ? undefined : resolve, host: binding ? hosted?.(name, binding) : undefined });
    apps[name] = Object.freeze({ ...tools(link, contract, expect), resources: resources(link, contract, expect), ext: Object.freeze({ events: events(link, contract, expect) }), close: link.close });
  }
  return Object.freeze(apps);
}

// Object methods JavaScript calls implicitly; tools with these names stay reachable through callTool.
const reserved = new Set(["then", "toJSON", "toString", "valueOf", "toLocaleString"]);

function tools(link: Link, contract: Contract | null, expect: Expect): Pick<RuntimeClient, "callTool" | "listTools" | "tools"> {
  const { name } = link;
  // The server validates arguments; the client checks the output against the contract it was compiled against.
  const definitions = new Map((contract?.tools ?? []).map(definition => [definition.name, { definition, output: definition.outputSchema && expect(definition.outputSchema, `structured output from ${name}.${definition.name}`) }]));
  const callTool = async (request: CallMetadata & { name: string; arguments?: Record<string, unknown> }, { elicit, ...options }: ToolCallOptions = {}): Promise<ToolResult<unknown>> => {
    const tool = definitions.get(request.name);
    if (!tool && contract) throw new Error(`Unknown tool ${name}.${request.name}.`);
    // A contract's tool is the tool as its server listed it.
    const sent = { ...patient(options), allowInputRequired: true, ...(tool && { toolDefinition: { ...tool.definition, outputSchema: undefined } as Tool }) };
    const label = `${name}.${request.name}`;
    const result = await link.session(options, async (client, connection) => {
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
    if (!result.isError) tool?.output?.(result.structuredContent);
    // isError tells ToolResult's success variant from its error variant.
    return { ...result, resultType: "complete" } as ToolResult<unknown>;
  };
  const listTools = (options?: CallOptions) => link.session(options, client => client.listTools(undefined, patient(options)));
  const tools: Record<string, RuntimeClient["tools"][string]> = Object.create(null);
  for (const tool of contract?.tools ?? []) if (!reserved.has(tool.name)) {
    tools[tool.name] = async (input, options) => {
      const result = await callTool({ name: tool.name, arguments: input }, options);
      if (result.resultType === "input_required" || result.isError) throw new ToolCallError(name, tool.name, result);
      return tool.outputSchema ? result.structuredContent : result;
    };
  }
  // Generated clients narrow callTool to their contract's tools and outputs, which validation upholds.
  return { callTool: callTool as RuntimeClient["callTool"], listTools, tools: Object.freeze(tools) };
}

function resources(link: Link, contract: Contract | null, expect: Expect): RuntimeClient["resources"] {
  const { name } = link;
  const resources: Record<string, RuntimeClient["resources"][string]> = Object.create(null);
  for (const resource of contract?.resources ?? []) {
    const check = expect(resource.outputSchema, `contents from ${name} ${resource.uri}`);
    const parse = (result: ReadResourceResult): unknown => {
      // Contracted resources are JSON in their first text content.
      const [content] = result.contents;
      if (!content || !("text" in content)) throw new Error(`Invalid contents from ${name} ${resource.uri}: no text content`);
      const value = JSON.parse(content.text);
      check(value);
      return value;
    };
    const read = async (options?: CallOptions) => parse(await link.session(options, client => client.readResource({ uri: resource.uri }, patient(options))));
    const watch = async (onChange: (value: unknown) => void | Promise<void>, { signal }: { signal?: AbortSignal } = {}) => {
      const resolved = link.endpoint(`Watching ${name} ${resource.uri}`);
      // An abort ends the wait between attempts early instead of failing it.
      for (let established = false; !signal?.aborted; await sleep(1000, signal)) {
        const current = link.connect(resolved);
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
  return Object.freeze(resources);
}

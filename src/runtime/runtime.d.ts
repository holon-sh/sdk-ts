import type { AuthProvider, CallOptions, ToolClient } from "./protocol.js";
export { ToolCallError } from "./protocol.js";
export type {
  AuthProvider,
  CallOptions,
  CallMetadata,
  ToolResult,
  ToolClient,
} from "./protocol.js";

/** Endpoint used when a generated client has no explicit binding. */
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
/** Bind a browser client to its MCP App host. The host owns authentication and connections; resource watching and tool listing require a direct endpoint. */
export interface HostBinding {
  host: {
    callServerTool(
      params: { name: string; arguments?: Record<string, unknown> },
      options?: { signal?: AbortSignal },
    ): Promise<unknown>;
    readServerResource(
      params: { uri: string },
      options?: { signal?: AbortSignal },
    ): Promise<unknown>;
  };
}
/** Optional JSON Schema validator factory. The default validator is supplied by the runtime. */
export interface CreateOptions {
  validator?: (schema: object) => (value: unknown) => boolean;
}
/** Calling application identity and its declared dependencies. */
export interface Identity {
  name: string;
  version: string;
  requires?: Record<string, { name?: string; version?: string }>;
}
/** Generation-time tool and JSON resource schemas. A null contract permits unvalidated callTool requests. */
export interface Contract {
  tools: Array<{
    name: string;
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  }>;
  resources?: Array<{ uri: string; outputSchema: Record<string, unknown> }>;
}
/** Untyped client returned by the low-level runtime. Generated clients specialize its inputs, outputs, and resources. */
export type RuntimeClient = ToolClient<
  Record<string, Record<string, unknown>>,
  Record<string, unknown>,
  Record<string, unknown>
>;
/** Register a process-wide default binding resolver. Explicit bindings take precedence. Return undefined to use the dependency MCP_URL environment variable in Node. Register during startup. */
export declare function setDefaultBinding(
  resolve: (app: string) => Binding | undefined,
): void;
/** Construct runtime clients from identity and contracts. Connections are opened lazily. Explicit/resolved endpoint bindings reuse sessions unless scoped is true; environment-only bindings use one session per call. Close persistent clients on shutdown. Most callers use the generated package root instead. */
export declare function createApps(
  identity: Identity,
  contracts: Record<string, Contract | null>,
  bindings?: Record<string, Binding | HostBinding>,
  options?: CreateOptions,
): Readonly<Record<string, RuntimeClient>>;
/** Construct only the explicitly bound dependencies. Unknown names throw; an empty binding map selects none. Used by generated createApps factories. */
export declare function bindApps(
  identity: Identity,
  contracts: Record<string, Contract | null>,
  bindings: Record<string, Binding | HostBinding>,
  options?: CreateOptions,
): Readonly<Record<string, RuntimeClient>>;
/** Options for exposing an existing client through browser WebMCP. Aborting unregisters the exposed tools. */
export interface ExposeOptions {
  signal?: AbortSignal;
  execute?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}
/** Expose a client tool catalog to browser WebMCP. Returns false when WebMCP is unavailable. Requires tool listing, so a host binding cannot supply the catalog. Pass signal to remove registrations when the page closes. */
export declare function exposeTools(
  app: Pick<RuntimeClient, "callTool" | "listTools">,
  options?: ExposeOptions,
): Promise<boolean>;
/** Standard Schema validation result: a parsed value or validation issues. */
export type PageResult<I> =
  | { readonly value: I; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<{ readonly message: string }> };
/** Standard Schema v1 validator with a JSON Schema input adapter. */
export interface PageSchema<I = unknown> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly types?: { readonly input: unknown; readonly output: I };
    readonly validate: (
      value: unknown,
    ) => PageResult<I> | Promise<PageResult<I>>;
    readonly jsonSchema: {
      readonly input: (options: { target: "draft-2020-12" }) => object;
    };
  };
}
/** Infer the validated input type from a page tool schema. */
export type PageInput<S> = S extends PageSchema<infer I> ? I : never;
/** Optional MCP hints describing a page tool. Hints do not enforce authorization. */
export interface PageAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}
/** Page-local tool definition with a validated input schema and execution callback. */
export interface PageTool<S extends PageSchema = PageSchema> {
  description: string;
  inputSchema: S;
  annotations?: PageAnnotations;
  execute: (args: PageInput<S>) => unknown;
}
/** MCP App view host that can register page-local tools. */
export interface PageHost {
  registerTool(
    name: string,
    config: {
      description: string;
      inputSchema: PageSchema;
      annotations?: PageAnnotations;
    },
    callback: (args: any, extra: any) => any,
  ): { remove(): void };
}
/** Register schema-validated page tools with WebMCP and/or an MCP App view. Returns whether at least one surface was available. Pass signal for registration cleanup. */
export declare function registerPageTools<
  S extends { [name: string]: PageSchema },
>(
  tools: { [K in keyof S]: PageTool<S[K]> },
  options?: { view?: PageHost; signal?: AbortSignal },
): Promise<boolean>;

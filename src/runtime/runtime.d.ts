import type { AuthProvider, CallOptions, ToolClient } from "./protocol.js";
export { ToolCallError } from "./protocol.js";
export type { AuthProvider, CallOptions, CallMetadata, ToolResult, ToolClient } from "./protocol.js";

/** Endpoint used when a generated client has no explicit binding. */
export interface Binding {
  endpoint: URL | string;
  authProvider?: AuthProvider;
  fetch?: typeof fetch;
  installationUID?: string;
  /** Close the session after every call instead of keeping one connection open. */
  scoped?: boolean;
}
export type EndpointBinding = Binding;
export interface HostBinding {
  host: {
    callServerTool(params: { name: string; arguments?: Record<string, unknown> }, options?: { signal?: AbortSignal }): Promise<unknown>;
    readServerResource(params: { uri: string }, options?: { signal?: AbortSignal }): Promise<unknown>;
  };
}
export interface CreateOptions { validator?: (schema: object) => (value: unknown) => boolean }
export interface Identity { name: string; version: string; requires?: Record<string, { name?: string; version?: string }> }
export interface Contract {
  tools: Array<{ name: string; inputSchema: Record<string, unknown>; outputSchema?: Record<string, unknown> }>;
  resources?: Array<{ uri: string; outputSchema: Record<string, unknown> }>;
}
export type RuntimeClient = ToolClient<Record<string, Record<string, unknown>>, Record<string, unknown>, Record<string, unknown>>;
export declare function setDefaultBinding(resolve: (app: string) => Binding | undefined): void;
export declare function createApps(identity: Identity, contracts: Record<string, Contract | null>, bindings?: Record<string, Binding | HostBinding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;
export declare function bindApps(identity: Identity, contracts: Record<string, Contract | null>, bindings: Record<string, Binding | HostBinding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;
export interface ExposeOptions { signal?: AbortSignal; execute?: (name: string, args: Record<string, unknown>) => Promise<unknown> }
export declare function exposeTools(app: Pick<RuntimeClient, "callTool" | "listTools">, options?: ExposeOptions): Promise<boolean>;
export type PageResult<I> = { readonly value: I; readonly issues?: undefined } | { readonly issues: ReadonlyArray<{ readonly message: string }> };
export interface PageSchema<I = unknown> { readonly "~standard": { readonly version: 1; readonly vendor: string; readonly types?: { readonly input: unknown; readonly output: I }; readonly validate: (value: unknown) => PageResult<I> | Promise<PageResult<I>>; readonly jsonSchema: { readonly input: (options: { target: "draft-2020-12" }) => object } } }
export type PageInput<S> = S extends PageSchema<infer I> ? I : never;
export interface PageAnnotations { title?: string; readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean }
export interface PageTool<S extends PageSchema = PageSchema> { description: string; inputSchema: S; annotations?: PageAnnotations; execute: (args: PageInput<S>) => unknown }
export interface PageHost { registerTool(name: string, config: { description: string; inputSchema: PageSchema; annotations?: PageAnnotations }, callback: (args: any, extra: any) => any): { remove(): void } }
export declare function registerPageTools<S extends { [name: string]: PageSchema }>(tools: { [K in keyof S]: PageTool<S[K]> }, options?: { view?: PageHost; signal?: AbortSignal }): Promise<boolean>;

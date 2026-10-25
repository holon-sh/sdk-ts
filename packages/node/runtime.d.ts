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
export interface CreateOptions { validator?: (schema: object) => (value: unknown) => boolean }
export interface Identity { name: string; version: string; requires?: Record<string, { name?: string; version?: string }> }
export interface Contract {
  tools: Array<{ name: string; inputSchema: Record<string, unknown>; outputSchema?: Record<string, unknown> }>;
  resources?: Array<{ uri: string; outputSchema: Record<string, unknown> }>;
}
export type RuntimeClient = ToolClient<Record<string, Record<string, unknown>>, Record<string, unknown>, Record<string, unknown>>;
export declare function setDefaultBinding(resolve: (app: string) => Binding | undefined): void;
export declare function createApps(identity: Identity, contracts: Record<string, Contract | null>, bindings?: Record<string, Binding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;
export declare function bindApps(identity: Identity, contracts: Record<string, Contract | null>, bindings: Record<string, Binding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;

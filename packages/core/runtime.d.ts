import type { AuthProvider, CallOptions, ToolClient } from "./protocol.js";
export { ToolCallError } from "./protocol.js";
export type { AuthProvider, CallOptions, CallMetadata, ToolResult, ToolClient } from "./protocol.js";

/** Endpoint the runtime connects to over Streamable HTTP. */
export interface Binding {
  endpoint: URL | string;
  authProvider?: AuthProvider;
  fetch?: typeof fetch;
  installationUID?: string;
  /** Close the session after every call instead of keeping one connection open. */
  scoped?: boolean;
}
export type EndpointBinding = Binding;
export interface Identity { name: string; version: string; requires?: Record<string, { name?: string; version?: string }> }
export interface Contract {
  tools: Array<{ name: string; inputSchema: Record<string, unknown>; outputSchema?: Record<string, unknown> }>;
  resources?: Array<{ uri: string; outputSchema: Record<string, unknown> }>;
}
export type RuntimeClient = ToolClient<Record<string, Record<string, unknown>>, Record<string, unknown>, Record<string, unknown>>;
/** The subset of an MCP client a session must provide. */
export interface ToolSession {
  callTool(request: { name: string; arguments?: Record<string, unknown> }, options?: Record<string, unknown>): Promise<any>;
  readResource(request: { uri: string }, options?: Record<string, unknown>): Promise<any>;
  listTools(params?: undefined, options?: Record<string, unknown>): Promise<any>;
}
export interface CreateOptions<B = Binding> {
  validator?: (schema: object) => (value: unknown) => boolean;
  /** Binding of an app created without explicit bindings; consulted on every call. */
  resolve?: (app: string) => Binding | undefined;
  /** Session for a binding the runtime does not connect to itself (anything without an endpoint). */
  session?: (app: string, binding: B) => ToolSession | undefined;
}
export declare function createApps<B = Binding>(identity: Identity, contracts: Record<string, Contract | null>, bindings?: Record<string, B>, options?: CreateOptions<B>): Readonly<Record<string, RuntimeClient>>;
export declare function bindApps<B = Binding>(identity: Identity, contracts: Record<string, Contract | null>, bindings: Record<string, B>, options?: CreateOptions<B>): Readonly<Record<string, RuntimeClient>>;

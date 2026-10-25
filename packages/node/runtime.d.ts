export { ToolCallError } from "./protocol.js";
export type { AuthProvider, CallOptions, CallMetadata, ToolResult, ToolClient } from "./protocol.js";

import type { Binding, Identity, Contract, RuntimeClient, CreateOptions as CoreOptions } from "holon-core";
export type { Binding, EndpointBinding, Identity, Contract, RuntimeClient } from "holon-core";
/** Optional JSON Schema validator factory. The default uses Ajv. */
export interface CreateOptions extends Pick<CoreOptions, "validator"> {}
/** For hosts: register a process-wide resolver for clients created without explicit bindings. Explicit bindings take precedence; return undefined to fall back to the <NAME>_MCP_URL environment variable. Register during startup. */
export declare function setDefaultBinding(resolve: (app: string) => Binding | undefined): void;
/** Construct runtime clients from identity and contracts. Connections open lazily. Explicit and resolved endpoint bindings reuse one session unless scoped is true; <NAME>_MCP_URL bindings use one session per call. Close persistent clients on shutdown. Most callers use the generated package root. */
export declare function createApps(identity: Identity, contracts: Record<string, Contract | null>, bindings?: Record<string, Binding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;
/** Construct only the explicitly bound dependencies. Unknown names throw; an empty binding map selects none. Used by generated createApps factories. */
export declare function bindApps(identity: Identity, contracts: Record<string, Contract | null>, bindings: Record<string, Binding>, options?: CreateOptions): Readonly<Record<string, RuntimeClient>>;

/** The user a request acts for, as Holon admitted it. claims and actor are the identity provider's, as issued. */
export interface Principal { issuer: string; subject: string; clientId: string; scopes: string[]; claims: Record<string, unknown>; actor?: unknown }
/** The caller of the current MCP request. principal is null for anonymous requests. */
export interface RequestContext { principal: Principal | null }
/** Read the caller from the context an MCP server receives: a tool callback's ctx.http, or the McpRequestContext of a createMcpHandler factory. */
export declare function getContext(context?: { authInfo?: { clientId: string; scopes: string[]; extra?: Record<string, unknown> } }): RequestContext;

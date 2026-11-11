/** Standard OpenID Connect address claims. */
export interface AddressClaims {
  formatted?: string; street_address?: string; locality?: string; region?: string; postal_code?: string; country?: string;
  [claim: string]: unknown;
}
/** Standard OpenID Connect claims. Holon drops one whose value has the wrong type; other claims pass through as JSON. */
export interface IdentityClaims {
  name?: string; given_name?: string; family_name?: string; middle_name?: string; nickname?: string;
  preferred_username?: string; profile?: string; picture?: string; website?: string; email?: string;
  email_verified?: boolean; gender?: string; birthdate?: string; zoneinfo?: string; locale?: string;
  phone_number?: string; phone_number_verified?: boolean; address?: AddressClaims; updated_at?: number;
  [claim: string]: unknown;
}
/** The user a request acts for, as Holon admitted it. */
export interface Principal { issuer: string; subject: string; clientId: string; scopes: string[]; claims: IdentityClaims; actor?: Record<string, unknown> }
/** The caller of the current MCP request. principal is null for anonymous requests. */
export interface RequestContext { principal: Principal | null }

// Holon admits the caller before the request reaches the server and hands it over as MCP's authInfo, with claims and
// act in these shapes.
interface Admitted { iss?: unknown; sub?: unknown; claims?: IdentityClaims; act?: Record<string, unknown> }

/** Read the caller from the context an MCP server receives: a tool callback's ctx.http, or the McpRequestContext of a createMcpHandler factory. */
export function getContext(context: { authInfo?: { clientId: string; scopes: string[]; extra?: Record<string, unknown> } } = {}): RequestContext {
  const { authInfo } = context;
  const { iss, sub, claims, act } = (authInfo?.extra ?? {}) as Admitted;
  if (!authInfo || typeof iss !== "string" || typeof sub !== "string") return { principal: null };
  return { principal: { issuer: iss, subject: sub, clientId: authInfo.clientId, scopes: authInfo.scopes, claims: claims ?? {}, ...(act && { actor: act }) } };
}

/** What streamAnswer reads from a tool callback's ctx. */
interface Answering {
  mcpReq: {
    _meta?: { progressToken?: string | number };
    signal: AbortSignal;
    notify(notification: { method: string; params: Record<string, unknown> }): Promise<void>;
  };
}

/**
 * Stream a tool call's answer to its caller in parts, such as a model's tokens or a kernel's output. Pass the tool
 * callback's ctx and await each send. A send rejects once the caller has left, which ends a loop that sends; pass
 * ctx.mcpReq.signal to the work as well, so it stops at once. A caller that asked for no progress hears no parts, so
 * the tool's result is still the whole answer.
 */
export function streamAnswer<Part = unknown>(ctx: Answering): (part: Part) => Promise<void> {
  const progressToken = ctx.mcpReq._meta?.progressToken;
  let progress = 0;
  return async part => {
    ctx.mcpReq.signal.throwIfAborted();
    // MCP has no partial results, so a part rides on the call's own progress, whose count MCP requires to increase.
    if (progressToken !== undefined) await ctx.mcpReq.notify({ method: "notifications/progress", params: { progressToken, progress: ++progress, _meta: { "sh.holon/partial": part } } });
  };
}

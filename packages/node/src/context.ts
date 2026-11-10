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

import type { AuthInfo } from "@modelcontextprotocol/client";

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
/** The app that made a request, within its session. */
export interface Caller { app: string; session: string }
/** The caller of the current MCP request, and the origin it reached the app at. principal is null for anonymous requests, caller for requests no app made, and origin without HTTP. */
export interface RequestContext { principal: Principal | null; caller: Caller | null; origin: string | null }

// Holon admits the caller before the request reaches the server and hands it over as MCP's authInfo, with claims and
// act in these shapes.
interface Admitted { iss?: unknown; sub?: unknown; claims?: IdentityClaims; act?: Record<string, unknown>; caller?: Caller }

/** Read the caller and the app's origin from the context an MCP server receives: a tool callback's ctx.http, or the McpRequestContext of a createMcpHandler factory. */
export function getContext(context: { authInfo?: Pick<AuthInfo, "clientId" | "scopes" | "extra">; req?: Request; requestInfo?: Request } = {}): RequestContext {
  const { authInfo, req = context.requestInfo } = context;
  const { iss, sub, claims, act, caller } = (authInfo?.extra ?? {}) as Admitted;
  const principal = !authInfo || typeof iss !== "string" || typeof sub !== "string" ? null
    : { issuer: iss, subject: sub, clientId: authInfo.clientId, scopes: authInfo.scopes, claims: claims ?? {}, ...(act && { actor: act }) };
  return { principal, caller: caller ?? null, origin: req ? origin(req) : null };
}

// Holon forwards the origin it serves the app at, as a proxy in front may. Otherwise the request reached the app where it
// listens.
function origin({ url, headers }: Request) {
  const { protocol, host } = new URL(url);
  return `${headers.get("x-forwarded-proto") ?? protocol.slice(0, -1)}://${headers.get("x-forwarded-host") ?? host}`;
}

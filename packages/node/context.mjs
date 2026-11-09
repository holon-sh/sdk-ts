// Holon admits the caller before the request reaches the server and hands it over as MCP's authInfo.
export function getContext({ authInfo } = {}) {
  const { iss, sub, claims, act } = authInfo?.extra ?? {};
  if (typeof sub !== "string") return { principal: null };
  return { principal: { issuer: iss, subject: sub, clientId: authInfo.clientId, scopes: authInfo.scopes, claims: claims ?? {}, ...(act && { actor: act }) } };
}

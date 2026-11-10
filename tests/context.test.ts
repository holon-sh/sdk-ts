import { test } from "node:test";
import assert from "node:assert/strict";
import { getContext } from "holon-sh/context";

// Holon's host hands a server what it admitted as authInfo, which a tool reads from ctx.http.
test("getContext maps the caller Holon admitted", () => {
  const claims = { email: "user@example.com", email_verified: true };
  for (const [authInfo, principal] of [
    [undefined, null],
    [
      { clientId: "web", scopes: ["read", "write"], extra: { iss: "https://id.example", sub: "user", claims, act: { sub: "agent" } } },
      { issuer: "https://id.example", subject: "user", clientId: "web", scopes: ["read", "write"], claims, actor: { sub: "agent" } },
    ],
    [
      { clientId: "web", scopes: [], extra: { iss: "https://id.example", sub: "user" } },
      { issuer: "https://id.example", subject: "user", clientId: "web", scopes: [], claims: {} },
    ],
    // A hook call carries no user.
    [{ clientId: "", scopes: [], extra: { hook: { event: "installed" } } }, null],
  ] satisfies Array<[unknown, unknown]>) assert.deepEqual(getContext({ authInfo }), { principal });
  assert.deepEqual(getContext(), { principal: null });
});

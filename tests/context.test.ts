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
  ] satisfies Array<[unknown, unknown]>) assert.deepEqual(getContext({ authInfo }).principal, principal);
  assert.deepEqual(getContext(), { principal: null, caller: null, origin: null });
  const caller = { app: "reporter", session: "session" };
  assert.deepEqual(getContext({ authInfo: { clientId: "", scopes: [], extra: { caller } } }).caller, caller);
});

// A factory's McpRequestContext carries the request as requestInfo, where a tool's ctx.http carries it as req.
test("getContext reads the origin a proxy forwards, or else the one the request reached", () => {
  const forwarded = { "x-forwarded-host": "app.example", "x-forwarded-proto": "https" };
  assert.equal(getContext({ requestInfo: new Request("http://127.0.0.1:3000/mcp", { headers: forwarded }) }).origin, "https://app.example");
  assert.equal(getContext({ req: new Request("http://127.0.0.1:3000/mcp") }).origin, "http://127.0.0.1:3000");
});

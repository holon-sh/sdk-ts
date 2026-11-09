import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "@modelcontextprotocol/server";
import { getContext } from "holon-sh/context";
import { createApps } from "holon-sh/runtime";
import { serve } from "./helpers.mjs";

test("getContext reads the caller Holon hands a server as authInfo, in a tool and in the factory", { timeout: 10000 }, async t => {
  let authInfo;
  // Holon's host passes what it admitted to the MCP handler as authInfo, as req.auth does here.
  const { endpoint } = await serve(t, context => {
    const server = new McpServer({ name: "chat", version: "1" });
    server.registerTool("whoami", {}, async ctx => ({ content: [], structuredContent: { tool: getContext(ctx.http), factory: getContext(context) } }));
    return server;
  }, req => { req.auth = authInfo; });
  const { chat } = createApps({ name: "test", version: "1" }, { chat: null }, { chat: { endpoint } });
  t.after(() => chat.close());
  const claims = { email: "user@example.com", email_verified: true };
  for (const [admitted, principal] of [
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
  ]) {
    authInfo = admitted;
    const { structuredContent } = await chat.callTool({ name: "whoami", arguments: {} });
    assert.deepEqual(structuredContent, { tool: { principal }, factory: { principal } });
  }
});

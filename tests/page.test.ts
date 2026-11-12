import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { createPage } from "holon-sh/page";
import { serve, temporary } from "./helpers.ts";

test("a page is the view a tool names: one HTML file of MCP Apps' type, with the view's _meta", async t => {
  const file = join(temporary(t), "index.html");
  writeFileSync(file, "<p>page</p>");
  const page = createPage(pathToFileURL(file), { csp: { resourceDomains: ["https://cdn.example"] } });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "app", version: "1.0.0" });
    server.registerTool("open", { description: "Opens the page", _meta: page.meta }, () => ({ content: [] }));
    page.serve(server);
    return server;
  });
  // An MCP Apps host is an MCP client.
  const host = new Client({ name: "host", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await host.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => host.close());

  const { tools: [open] } = await host.listTools();
  const uri = (open!._meta as { ui: { resourceUri: string } }).ui.resourceUri;
  assert.deepEqual((await host.readResource({ uri })).contents, [
    { uri, mimeType: "text/html;profile=mcp-app", text: "<p>page</p>", _meta: { ui: { csp: { resourceDomains: ["https://cdn.example"] } } } },
  ]);
});

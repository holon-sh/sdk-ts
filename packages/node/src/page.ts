import { readFile } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/server";

// MCP Apps names a view with a ui:// URI and serves it as this type. An app has one page, so the URI names no app and
// survives renaming one.
// https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
const uri = "ui://page";
const mimeType = "text/html;profile=mcp-app";

/** An app's page, as the view an MCP Apps host shows with a tool's result. */
export interface Page {
  /** A tool's `_meta`, so that hosts show the page with what the tool returns. */
  meta: { ui: { resourceUri: string } };
  /** Offers the page to a server's clients as its view. */
  serve(server: Pick<McpServer, "registerResource">): void;
}

/**
 * Makes an app's page a view: `file` is the page built as one HTML file, and `ui` the view's `_meta.ui`, such as its
 * `csp`.
 *
 * ```ts
 * const page = createPage(new URL("../dist/mcp/index.html", import.meta.url));
 * server.registerTool("open", { description: "Opens it", _meta: page.meta }, open);
 * page.serve(server);
 * ```
 */
export function createPage(file: URL, ui: Record<string, unknown> = {}): Page {
  return {
    meta: { ui: { resourceUri: uri } },
    serve: server =>
      void server.registerResource("Page", uri, { mimeType }, async () => ({
        contents: [{ uri, mimeType, text: await readFile(file, "utf8"), _meta: { ui } }],
      })),
  };
}

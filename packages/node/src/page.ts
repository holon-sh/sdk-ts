import { readFile } from "node:fs/promises";
import { type McpUiAppResourceConfig, RESOURCE_MIME_TYPE, registerAppResource } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";

// An app has one page, so its ui:// URI names no app and survives renaming one.
const uri = "ui://page";

type ViewMeta = NonNullable<NonNullable<McpUiAppResourceConfig["_meta"]>["ui"]>;

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
export function createPage(file: URL, ui: ViewMeta = {}): Page {
  return {
    meta: { ui: { resourceUri: uri } },
    serve: server =>
      void registerAppResource(server, "Page", uri, {}, async () => ({
        contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: await readFile(file, "utf8"), _meta: { ui } }],
      })),
  };
}

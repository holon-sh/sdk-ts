import { readFile } from "node:fs/promises";

/** MIME type of an MCP App HTML resource. */
export const VIEW_MIME_TYPE = "text/html;profile=mcp-app";

/** Allowed network and asset domains for the view content security policy. */
export interface ViewOptions {
  csp?: { connectDomains?: string[]; resourceDomains?: string[] };
}

type ViewRegistration = [
  name: string,
  uri: string,
  metadata: {
    mimeType: string;
    _meta: {
      ui: { csp: { connectDomains: string[]; resourceDomains: string[] } };
    };
  },
  read: () => Promise<{
    ttlMs: number;
    cacheScope: "private";
    contents: { uri: string; mimeType: string; text: string }[];
  }>,
];

/**
 * Create a registration tuple for server.registerResource(...appView(...)).
 * Node only: the HTML file is read once when this helper is called.
 * Resource reads reuse that promise; file read failures reject resource requests.
 * @param name Human-readable resource name.
 * @param uri Resource URI, usually starting with ui://.
 * @param file Built HTML file path or file URL.
 * @param options View content security policy.
 * @returns Name, URI, metadata, and resource-read callback.
 * @example
 * server.registerResource(...appView("App", "ui://app/index.html", new URL("./index.html", import.meta.url)));
 */
export function appView(
  name: string,
  uri: string,
  file: URL | string,
  options: ViewOptions = {},
): ViewRegistration {
  const csp = { connectDomains: [], resourceDomains: [], ...options.csp };
  const page = readFile(file, "utf8");
  page.catch(() => {});
  return [
    name,
    uri,
    { mimeType: VIEW_MIME_TYPE, _meta: { ui: { csp } } },
    async () => ({
      ttlMs: 0,
      cacheScope: "private",
      contents: [{ uri, mimeType: VIEW_MIME_TYPE, text: await page }],
    }),
  ];
}

import { readFile } from "node:fs/promises";

export const VIEW_MIME_TYPE = "text/html;profile=mcp-app";

export interface ViewOptions {
  csp?: { connectDomains?: string[]; resourceDomains?: string[] };
}

type ViewRegistration = [
  name: string,
  uri: string,
  metadata: { mimeType: string; _meta: { ui: { csp: { connectDomains: string[]; resourceDomains: string[] } } } },
  read: () => Promise<{ ttlMs: number; cacheScope: "private"; contents: { uri: string; mimeType: string; text: string }[] }>,
];

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

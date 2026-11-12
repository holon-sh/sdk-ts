import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/** An app's module: the MCP handler it exports by default, and the directory of its page. */
export interface App {
  default: { fetch(request: Request): Promise<Response> };
  /** A file URL ending in `/`. */
  frontend?: URL;
}

// The types of the files a built page holds. Anything else is sent as bytes.
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".wasm": "application/wasm",
};

/**
 * Runs an app without Holon, at the paths Holon gives it: the MCP endpoint at `/mcp` and `/mcp/<app>`, and the page's
 * files everywhere else. Listens on `PORT` and `HOST`, or else on 127.0.0.1:3000.
 *
 * ```ts
 * await serve(await import("./server.ts"));
 * ```
 *
 * Holon answers clients of the 2025 MCP versions in front of an app. Here the handler answers them, so create it
 * without `legacy: "reject"`.
 */
export async function serve(app: App): Promise<Server> {
  const { PORT = "3000", HOST = "127.0.0.1" } = process.env;
  const server = createServer((req, res) =>
    respond(app, req, res).catch((error: unknown) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    }),
  );
  server.listen(Number(PORT), HOST);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  const origin = `http://${HOST.includes(":") ? `[${HOST}]` : HOST}:${port}`;
  console.log(`Serving ${origin}/ with the MCP endpoint at ${origin}/mcp`);
  return server;
}

async function respond({ default: handler, frontend }: App, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (/^\/mcp(\/[^/]+)?$/.test(url.pathname)) {
    const gone = new AbortController();
    res.on("close", () => gone.abort());
    const headers = new Headers();
    for (const [name, values = []] of Object.entries(req.headersDistinct)) for (const value of values) headers.append(name, value);
    // Holon forwards the origin it serves the app at. Here that is this server, unless a proxy in front forwards its own.
    if (!headers.has("x-forwarded-host")) headers.set("x-forwarded-host", url.host);
    if (!headers.has("x-forwarded-proto")) headers.set("x-forwarded-proto", "http");
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : req;
    const response = await handler.fetch(new Request(url, { method: req.method, headers, body, duplex: "half", signal: gone.signal }));
    res.setHeaders(response.headers).writeHead(response.status);
    // When the client leaves, pipeline cancels the body, so a stream between events ends then and not at its next
    // write. Either side failing ends the response, which is all there is to do.
    if (response.body) await pipeline(Readable.fromWeb(response.body), res).catch(() => {});
    else res.end();
    return;
  }
  if (!frontend || (req.method !== "GET" && req.method !== "HEAD")) return void res.writeHead(404).end();
  const name = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
  // The URL parser has resolved every `..`, and a file URL may not encode `/`, so no name leads out of the directory.
  // Like Holon, serve nothing hidden, however its dot is spelled, and treat what cannot be read, such as a directory, as
  // not found.
  const contents = /\/(\.|%2e)/i.test(name) ? undefined : await readFile(new URL(`.${name}`, frontend)).catch(() => undefined);
  if (!contents) return void res.writeHead(404).end();
  const type = types[extname(name)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type, "x-content-type-options": "nosniff" }).end(contents);
}

import { once } from "node:events";
import { readFile, realpath, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AuthInfo } from "@modelcontextprotocol/client";
import mime from "mime";
import { holder } from "./holder.js";

/** An app's module: the MCP handler it exports by default, and the directory of its page. */
export interface App {
  default: { fetch(request: Request, options?: { authInfo?: AuthInfo }): Promise<Response>; close?(): Promise<void> };
  /** The directory of the page's files, as a file URL. */
  frontend?: URL;
}

/**
 * Imports an app's module from its path, relative to the working directory, and checks that serve can run it: it
 * default-exports an MCP handler, such as createMcpHandler's, and its frontend, if it exports one, is a file URL. holon
 * reads an app's types through it too.
 */
export async function load(entry: string): Promise<App> {
  const app: Partial<App> = await import(pathToFileURL(resolve(entry)).href);
  if (typeof app.default?.fetch !== "function") throw new Error(`${entry} must default-export an MCP handler, such as createMcpHandler's`);
  if (app.frontend !== undefined && !(app.frontend instanceof URL && app.frontend.protocol === "file:")) throw new Error(`${entry} must export frontend as a file URL`);
  return { default: app.default, frontend: app.frontend };
}

/**
 * Runs an app at the paths Holon gives it: the MCP endpoint at `/mcp` and `/mcp/<app>`, and the page's files everywhere
 * else. Listens on `PORT` and `HOST`, or else on 127.0.0.1:3000, until SIGTERM.
 *
 * ```ts
 * await serve(await load("server.ts"));
 * ```
 *
 * Inside Holon, where `HOLON_PLATFORM` is `1`, a tool reads its caller from `ctx.http.authInfo`, and the dependencies it
 * calls through `<NAME>_MCP_URL` act for the same caller. Elsewhere every request is anonymous. Without Holon in front,
 * the handler answers clients of the 2025 MCP versions itself, so create it without `legacy: "reject"`.
 */
export async function serve({ default: handler, frontend }: App): Promise<Server> {
  const { PORT = "3000", HOST = "127.0.0.1", HOLON_PLATFORM } = process.env;
  // A directory's URL ends in `/`. Without it, a name would resolve beside the directory instead of in it.
  const directory = frontend && new URL(frontend.href.replace(/\/?$/, "/"));
  // A context is up to 16 KiB, as much as Node allows all of a request's headers by default.
  const server = createServer({ maxHeaderSize: 65536 }, (req, res) => {
    // Once the server stops listening, a connection closes as its response ends, not when its client lets it go.
    res.on("close", () => server.listening || server.closeIdleConnections());
    respond(handler, HOLON_PLATFORM === "1", directory, req, res).catch((error: unknown) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  server.listen(Number(PORT), HOST);
  await once(server, "listening");
  // The server takes no more connections and the handler ends what it is answering, so the process can exit.
  const stop = () => {
    server.close();
    handler.close?.().catch((error: unknown) => console.error(error));
  };
  process.once("SIGTERM", stop);
  server.once("close", () => process.off("SIGTERM", stop));
  const { port } = server.address() as AddressInfo;
  const origin = `http://${HOST.includes(":") ? `[${HOST}]` : HOST}:${port}`;
  console.log(`Serving ${origin}/ with the MCP endpoint at ${origin}/mcp`);
  return server;
}

async function respond(handler: App["default"], platform: boolean, directory: URL | undefined, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (/^\/mcp(\/[^/]+)?$/.test(url.pathname)) {
    const admitted = platform ? admit(req) : { token: "" };
    // A context the waypoint could not have sent is a malformed request (RFC 9110 §15.5.1).
    if (!admitted) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" }).end("Malformed Holon context\n");
      return;
    }
    const { token, authInfo } = admitted;
    const request = { token, ended: false };
    const gone = new AbortController();
    res.on("close", () => {
      request.ended = true;
      gone.abort();
    });
    // The app reads its caller from authInfo alone.
    const headers = new Headers();
    for (const [name, values = []] of Object.entries(req.headersDistinct))
      if (!name.startsWith("x-holon-") && name !== "authorization") for (const value of values) headers.append(name, value);
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : req;
    const response = await holder.run(request, () =>
      handler.fetch(new Request(url, { method: req.method, headers, body, duplex: "half", signal: gone.signal }), { authInfo }),
    );
    res.setHeaders(response.headers).writeHead(response.status);
    if (!response.body) return void res.end();
    // The body is read from the socket's callbacks, outside the request, so each read goes back into it: a peer call the
    // app makes while it streams still acts for the caller.
    const reader = response.body.getReader();
    const reentered = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await holder.run(request, () => reader.read());
        if (done) controller.close();
        else controller.enqueue(value);
      },
      cancel: reason => reader.cancel(reason),
    });
    // When the client leaves, pipeline cancels the body, so a stream between events ends then and not at its next
    // write. Either side failing ends the response, which is all there is to do.
    await pipeline(Readable.fromWeb(reentered), res).catch(() => {});
    return;
  }
  if (!directory || (req.method !== "GET" && req.method !== "HEAD")) return void res.writeHead(404).end();
  const file = await page(directory, url.pathname);
  if (!file) return void res.writeHead(404).end();
  // Like Holon, take the type from the MIME database, and call text UTF-8, which a built page is.
  const type = mime.getType(file.name) ?? "application/octet-stream";
  const contentType = type.startsWith("text/") ? `${type}; charset=utf-8` : type;
  res.writeHead(200, { "content-type": contentType, "x-content-type-options": "nosniff" }).end(file.contents);
}

// The forms of the headers Holon's waypoint sets: a context is a compact JWS, whose payload segment is matched, and a
// caller is the SPIFFE ID of an app of the session.
const contextForm = /^[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+$/;
const callerForm = /^spiffe:\/\/cluster\.local\/ns\/([^/]+)\/sa\/([^/]+)$/;

type Fields = Record<string, unknown>;
const isObject = (value: unknown): value is Fields => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const text = (value: unknown) => (isString(value) ? value : "");
// The principal's claims the SDK reads, each of which may be absent or null.
const principalTypes = { iss: isString, sub: isString, client_id: isString, scope: isString, claims: isObject, act: isObject };

// Inside Holon only the waypoint reaches the app. It verified the context and replaced whatever x-holon-* a client
// sent, and names the calling app of the session, a lifecycle hook's job as its app. admit answers undefined when the
// headers are malformed.
function admit(req: IncomingMessage): { token: string; authInfo?: AuthInfo } | undefined {
  const contexts = req.headersDistinct["x-holon-context"] ?? [];
  const callers = req.headersDistinct["x-holon-caller"] ?? [];
  if (contexts.length > 1 || callers.length > 1) return undefined;
  const token = contexts[0] ?? "";
  const principal = contexts.length ? principalOf(token) : null;
  const found = callers.length ? callerForm.exec(callers[0]!) : null;
  if (principal === undefined || (callers.length && !found)) return undefined;
  const caller = found ? { app: found[2]!, session: found[1]! } : undefined;
  if (!principal && !caller) return { token };
  return {
    token,
    authInfo: {
      token,
      clientId: text(principal?.client_id),
      scopes: text(principal?.scope).split(" ").filter(Boolean),
      extra: {
        ...(caller && { caller }),
        ...(principal && {
          iss: text(principal.iss), sub: text(principal.sub),
          ...(principal.claims != null && { claims: principal.claims }), ...(principal.act != null && { act: principal.act }),
        }),
      },
    },
  };
}

// principalOf reads a context's principal: null when it names none, and undefined when the context is malformed.
function principalOf(token: string): Fields | null | undefined {
  const payload = contextForm.exec(token)?.[1];
  let claims: unknown;
  try {
    claims = payload && JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return undefined;
  }
  if (!isObject(claims)) return undefined;
  const principal = claims.principal ?? null;
  if (principal === null) return null;
  const typed = isObject(principal) && Object.entries(principalTypes).every(([name, is]) => principal[name] == null || is(principal[name]));
  return typed ? principal : undefined;
}

// Like Holon, serve nothing hidden, however its dot is spelled, nothing a link leads out of the directory to, and only
// regular files, a directory's being its index.html.
async function page(directory: URL, pathname: string): Promise<{ name: string; contents: Buffer } | undefined> {
  if (/\/(\.|%2e)/i.test(pathname)) return;
  try {
    const root = await realpath(fileURLToPath(directory));
    // The URL parser has resolved every `..`, and a file URL may not encode `/`.
    let name = await realpath(fileURLToPath(new URL(`.${pathname}`, directory)));
    if ((await stat(name)).isDirectory()) name = await realpath(join(name, "index.html"));
    const path = relative(root, name);
    if (isAbsolute(path) || path.split(sep)[0] === ".." || !(await stat(name)).isFile()) return;
    return { name, contents: await readFile(name) };
  } catch {
    return undefined;
  }
}

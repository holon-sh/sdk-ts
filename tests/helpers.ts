import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { TestContext } from "node:test";
import { createMcpHandler, type McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport, toNodeHandler } from "@modelcontextprotocol/node";
import assert from "node:assert/strict";

export function temporary(t: TestContext): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "holon-sdk-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

// The project's TypeScript compiler, run the way a consumer runs it.
const manifest = import.meta.resolve("typescript/package.json");
const tsc = fileURLToPath(new URL(JSON.parse(readFileSync(new URL(manifest), "utf8")).bin.tsc, manifest));

export function typecheck(source: string): void {
  // The NodeNext pass also checks the shipped declarations; Bundler only re-resolves them.
  for (const options of [["--module", "nodenext"], ["--module", "esnext", "--moduleResolution", "bundler", "--skipLibCheck"]]) {
    const checked = spawnSync(process.execPath, [tsc, "--noEmit", "--strict", "--target", "es2023", "--types", "node", ...options, source], { cwd: dirname(source), encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  }
}

async function listen(t: TestContext, http: Server, close: () => Promise<unknown>): Promise<string> {
  t.after(async () => {
    await close();
    http.closeAllConnections();
    await http[Symbol.asyncDispose]();
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  return `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`;
}

export async function serve(t: TestContext, factory: Parameters<typeof createMcpHandler>[0], onRequest?: (req: IncomingMessage) => void) {
  const handler = createMcpHandler(factory, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => {
    onRequest?.(req);
    void dispatch(req, res).catch(() => res.destroy());
  });
  return { handler, endpoint: await listen(t, http, () => handler.close()) };
}

export async function serveLegacy(t: TestContext, factory: () => McpServer) {
  const sessions = new Map<string, NodeStreamableHTTPServerTransport>();
  const http = createServer(async (req, res) => {
    const id = req.headers["mcp-session-id"];
    if (typeof id === "string") {
      const session = sessions.get(id);
      return session ? session.handleRequest(req, res).catch(() => res.destroy()) : void res.writeHead(404).end();
    }
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: randomUUID, onsessioninitialized: id => { sessions.set(id, transport); }, onsessionclosed: id => { sessions.delete(id); } });
    await factory().connect(transport);
    await transport.handleRequest(req, res).catch(() => res.destroy());
    if (!transport.sessionId) await transport.close();
  });
  return { endpoint: await listen(t, http, () => Promise.all([...sessions.values()].map(transport => transport.close()))) };
}

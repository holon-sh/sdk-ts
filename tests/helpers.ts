import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { TestContext } from "node:test";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
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

export async function serve(t: TestContext, factory: Parameters<typeof createMcpHandler>[0], onRequest?: (req: IncomingMessage) => void) {
  const handler = createMcpHandler(factory, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => {
    onRequest?.(req);
    void dispatch(req, res).catch(() => res.destroy());
  });
  t.after(async () => {
    await handler.close();
    http.closeAllConnections();
    await http[Symbol.asyncDispose]();
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  return { handler, endpoint: `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp` };
}

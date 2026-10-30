import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import assert from "node:assert/strict";
import ts from "typescript";

export function temporary(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "holon-sdk-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

// Pack the workspace package and install it into a fresh consumer, as an app would.
export function install(t) {
  const root = temporary(t);
  const repository = dirname(dirname(fileURLToPath(import.meta.url)));
  const packed = spawnSync("npm", ["pack", "-w", "packages/node", "--ignore-scripts", "--json", "--pack-destination", root], { cwd: repository, encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);
  const [tarball] = JSON.parse(packed.stdout);
  const consumer = join(root, "consumer");
  mkdirSync(consumer);
  const dependencies = { "holon-sh": `file:${join(root, tarball.filename)}` };
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "module", private: true, dependencies }));
  // Runtime dependencies come from the npm cache or registry.
  const installed = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"], { cwd: consumer, encoding: "utf8" });
  assert.equal(installed.status, 0, installed.stderr);
  return { consumer, directory: join(consumer, "node_modules/holon-sh") };
}

export function typecheck(source) {
  for (const moduleResolution of [ts.ModuleResolutionKind.NodeNext, ts.ModuleResolutionKind.Bundler]) {
    const program = ts.createProgram([source], { noEmit: true, strict: true, target: ts.ScriptTarget.ES2023, moduleResolution, module: moduleResolution === ts.ModuleResolutionKind.NodeNext ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => dirname(source), getCanonicalFileName: p => p, getNewLine: () => "\n" }));
  }
}

export async function serve(t, factory, onRequest) {
  const handler = createMcpHandler(factory, { legacy: "reject" });
  const dispatch = toNodeHandler(handler);
  const http = createServer((req, res) => {
    onRequest?.(req);
    void dispatch(req, res).catch(() => res.destroy());
  });
  t.after(async () => {
    await handler.close();
    http.closeAllConnections();
    await new Promise(resolve => http.close(resolve));
  });
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  return { handler, endpoint: `http://127.0.0.1:${http.address().port}/mcp` };
}

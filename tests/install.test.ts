import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, readFileSync, writeFileSync, cpSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { temporary, typecheck } from "./helpers.ts";

const repository = dirname(import.meta.dirname);
const manifest = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"));

test("clients generated into a CommonJS project run on the packed package in NodeNext and Bundler", t => {
  const root = temporary(t);
  const packed = spawnSync("npm", ["pack", "-w", "packages/node", "--ignore-scripts", "--json", "--pack-destination", root], { cwd: repository, encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);
  const [tarball] = JSON.parse(packed.stdout);
  const consumer = join(root, "consumer");
  mkdirSync(consumer);
  // A Node.js project: its declarations, like the MCP SDK's, use Node's types.
  const dependencies = { "holon-sh": `file:${join(root, tarball.filename)}`, "@types/node": manifest.devDependencies["@types/node"] };
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "commonjs", private: true, imports: { "#holon-sh": "./generated/holon-sh/index.mjs" }, dependencies }));
  // Runtime dependencies come from the npm cache or registry.
  const installed = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"], { cwd: consumer, encoding: "utf8" });
  assert.equal(installed.status, 0, installed.stderr);
  // holon writes the clients into the project and maps #holon-sh to them; nothing is copied into node_modules.
  cpSync(new URL("./fixtures/checkout/", import.meta.url), join(consumer, "generated/holon-sh"), { recursive: true });
  const source = join(consumer, "consumer.mts");
  copyFileSync(new URL("./fixtures/consumer.ts", import.meta.url), source);
  typecheck(source);
  const load = "const [{ apps, ToolCallError }, { ToolCallError: same }] = await Promise.all([import('#holon-sh'), import('holon-sh/protocol')]); process.exit(apps.orders && ToolCallError === same ? 0 : 1);";
  const loaded = spawnSync(process.execPath, ["--input-type=module", "-e", load], { cwd: consumer, encoding: "utf8" });
  assert.equal(loaded.status, 0, loaded.stderr);
});

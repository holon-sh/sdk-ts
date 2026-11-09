import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync, cpSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { temporary, typecheck } from "./helpers.mjs";

const repository = dirname(dirname(fileURLToPath(import.meta.url)));

test("clients generated into a project run on the packed package in NodeNext and Bundler", t => {
  const root = temporary(t);
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
  // holon writes the clients into the project; nothing is copied into node_modules.
  cpSync(new URL("./fixtures/checkout/", import.meta.url), join(consumer, "generated/holon-sh"), { recursive: true });
  const source = join(consumer, "consumer.ts");
  copyFileSync(new URL("./fixtures/consumer.ts", import.meta.url), source);
  typecheck(source);
  const load = "const [{ apps, ToolCallError }, { ToolCallError: same }] = await Promise.all([import('./generated/holon-sh/index.js'), import('holon-sh/protocol')]); process.exit(apps.orders && ToolCallError === same ? 0 : 1);";
  const loaded = spawnSync(process.execPath, ["--input-type=module", "-e", load], { cwd: consumer, encoding: "utf8" });
  assert.equal(loaded.status, 0, loaded.stderr);
});

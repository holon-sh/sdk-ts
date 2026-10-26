import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync, readFileSync, cpSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { temporary, typecheck } from "./helpers.mjs";

const repository = dirname(dirname(fileURLToPath(import.meta.url)));

test("packed package supports placeholder and generated consumers in NodeNext and Bundler", async t => {
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
  const directory = join(consumer, "node_modules/holon-sh");
  const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  assert.deepEqual(metadata.holon, { slot: "generated", contractVersion: 1 });
  assert.deepEqual(JSON.parse(readFileSync(join(directory, "generated/holon-generated.json"), "utf8")), { marker: "holon-generated-apps-v1", placeholder: true });
  const placeholder = await import(`${pathToFileURL(join(directory, "generated/index.js"))}?placeholder`);
  assert.deepEqual(Object.keys(placeholder.createApps({})), []);
  assert.throws(() => placeholder.createApps({ unknown: { endpoint: "https://example.com/mcp" } }), /Run holon types generate/);
  const source = join(consumer, "consumer.ts");
  writeFileSync(source, `import { apps, createApps, type Apps, type Inputs, type Outputs } from "holon-sh";
import { setDefaultBinding, ToolCallError, type Binding } from "holon-sh/runtime";
import type { ToolClient } from "holon-sh/protocol";
import { appView } from "holon-sh/view";
const empty: Apps = createApps({});
const binding: Binding = { endpoint: "https://example.com/mcp", fetch };
setDefaultBinding(() => binding);
appView("view", "ui://view", "index.html");
// @ts-expect-error types generation has not run
apps.orders;
// @ts-expect-error the placeholder has no bindings
createApps({orders: binding});
`);
  typecheck(source);
  // Replace the installed slot with CLI output, retaining the real package layout.
  cpSync(new URL("./fixtures/checkout/", import.meta.url), join(directory, "generated"), { recursive: true });
  copyFileSync(new URL("./fixtures/consumer.ts", import.meta.url), source);
  typecheck(source);
  const { apps } = await import(pathToFileURL(join(directory, "generated/index.js")));
  assert.equal(await apps.orders.tools, apps.orders.tools);
});

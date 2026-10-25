import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, cpSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { temporary, typecheck } from "./helpers.mjs";

const repository = dirname(dirname(fileURLToPath(import.meta.url)));

test("packed packages support placeholder and generated consumers in NodeNext and Bundler", async t => {
  const root = temporary(t);
  const packed = spawnSync("npm", ["pack", "-w", "packages/core", "-w", "packages/node", "--ignore-scripts", "--json", "--pack-destination", root], { cwd: repository, encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);
  const tarballs = Object.fromEntries(JSON.parse(packed.stdout).map(info => [info.name, info]));
  const consumer = join(root, "consumer");
  mkdirSync(consumer);
  const dependencies = { "holon-core": `file:${join(root, tarballs["holon-core"].filename)}`, "holon-sh": `file:${join(root, tarballs["holon-sh"].filename)}` };
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "module", private: true, dependencies }));
  // holon-core's own dependencies come from the npm cache or registry.
  const installed = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline"], { cwd: consumer, encoding: "utf8", env: { ...process.env, HOLON_SKIP_POSTINSTALL: "1" } });
  assert.equal(installed.status, 0, installed.stderr);
  const directory = join(consumer, "node_modules/holon-sh");
  const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  assert.deepEqual(metadata.holon, { slot: "generated", contractVersion: 1 });
  assert.deepEqual(Object.keys(metadata.dependencies), ["holon-core"]);
  assert.equal(JSON.parse(readFileSync(join(consumer, "node_modules/holon-core/package.json"), "utf8")).holon, undefined);
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

test("postinstall generates types for a server directory and never makes package installation fail", t => {
  const root = temporary(t);
  const nested = join(root, "app/nested");
  const bin = join(root, "bin");
  mkdirSync(nested, { recursive: true });
  mkdirSync(bin);
  const descriptor = join(nested, "server.json");
  const log = join(root, "invocation.json");
  writeFileSync(join(bin, "holon"), `#!${process.execPath}\nimport {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(log)},JSON.stringify({args:process.argv.slice(2), cwd:process.cwd(), guard:process.env.HOLON_POSTINSTALL_RUNNING})); process.exit(9);\n`, { mode: 0o755 });
  writeFileSync(join(bin, "package.json"), '{"type":"module"}');
  const run = env => spawnSync(process.execPath, [join(repository, "packages/node/postinstall.mjs")], { cwd: nested, env: { ...process.env, INIT_CWD: nested, PATH: bin, HOLON_SKIP_POSTINSTALL: "", HOLON_POSTINSTALL_RUNNING: "", ...env }, encoding: "utf8" });
  // Without a server.json in INIT_CWD, nothing runs (ancestors are not searched).
  writeFileSync(join(root, "server.json"), "{}");
  assert.equal(run({}).status, 0);
  assert.equal(existsSync(log), false);
  writeFileSync(descriptor, "{}");
  assert.equal(run({}).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(log, "utf8")), { args: ["types", "generate", "--no-install", "--quiet"], cwd: nested, guard: "1" });
  rmSync(log);
  for (const env of [{ HOLON_SKIP_POSTINSTALL: "1" }, { HOLON_POSTINSTALL_RUNNING: "1" }, { PATH: "" }]) {
    assert.equal(run(env).status, 0);
    assert.equal(existsSync(log), false);
  }
});

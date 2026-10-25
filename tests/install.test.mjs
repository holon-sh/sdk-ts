import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { temporary } from "./helpers.mjs";

test("the packed public package installs without dependencies and its placeholder types resolve", async t => {
  const root = temporary(t);
  const packed = spawnSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", root], { encoding: "utf8", env: { ...process.env, npm_config_cache: join(root, "npm-cache") } });
  assert.equal(packed.status, 0, packed.stderr);
  const info = JSON.parse(packed.stdout)[0];
  const paths = info.files.map(file => file.path);
  assert.ok(paths.includes("generated/holon-generated.json"));
  for (const path of paths) assert.doesNotMatch(path, /(?:^|\/)(?:context|identity|typecheck|runner|extract)\.|(?:^|\/)(?:src|tests|vendor|node_modules|schema|schemas)\//);
  const consumer = join(root, "consumer");
  mkdirSync(consumer);
  writeFileSync(join(consumer, "package.json"), '{"type":"module","private":true}');
  const installed = spawnSync("npm", ["install", "--offline", "--no-audit", "--no-fund", join(root, info.filename)], { cwd: consumer, encoding: "utf8", env: { ...process.env, npm_config_cache: join(root, "npm-cache"), HOLON_SKIP_POSTINSTALL: "1" } });
  assert.equal(installed.status, 0, installed.stderr);
  const directory = join(consumer, "node_modules/holon-sh");
  const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  assert.deepEqual(metadata.holon, { slot: "generated", contractVersion: 1 });
  assert.deepEqual(metadata.dependencies ?? {}, {});
  assert.deepEqual(JSON.parse(readFileSync(join(directory, "generated/holon-generated.json"), "utf8")), { marker: "holon-generated-apps-v1", placeholder: true });
  const browser = await import(pathToFileURL(join(directory, "generated/browser.js")));
  assert.deepEqual(Object.keys(browser.createApps({})), []);
  assert.throws(() => browser.createApps({ unknown: { endpoint: "https://example.com/mcp" } }), /Unknown app binding/);
  const source = join(consumer, "consumer.ts");
  writeFileSync(source, `import { apps, type Apps, type Inputs, type Outputs } from "holon-sh";
import { createApps, registerPageTools } from "holon-sh/browser";
import { setDefaultBinding, ToolCallError, type Binding } from "holon-sh/runtime";
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
  for (const moduleResolution of [ts.ModuleResolutionKind.NodeNext, ts.ModuleResolutionKind.Bundler]) {
    const program = ts.createProgram([source], { noEmit: true, strict: true, target: ts.ScriptTarget.ES2023, moduleResolution, module: moduleResolution === ts.ModuleResolutionKind.NodeNext ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => consumer, getCanonicalFileName: p => p, getNewLine: () => "\n" }));
  }
});

test("postinstall finds the ancestor manifest and never makes package installation fail", t => {
  const root = temporary(t);
  const nested = join(root, "app/nested");
  const bin = join(root, "bin");
  mkdirSync(nested, { recursive: true });
  mkdirSync(bin);
  const manifest = join(root, "holon.yaml");
  const log = join(root, "invocation.json");
  writeFileSync(manifest, "apps: []\n");
  writeFileSync(join(bin, "holon"), `#!${process.execPath}\nimport {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(log)},JSON.stringify({args:process.argv.slice(2), cwd:process.cwd(), guard:process.env.HOLON_POSTINSTALL_RUNNING})); process.exit(9);\n`, { mode: 0o755 });
  writeFileSync(join(bin, "package.json"), '{"type":"module"}');
  const run = env => spawnSync(process.execPath, [resolve("postinstall.mjs")], { cwd: nested, env: { ...process.env, INIT_CWD: nested, PATH: bin, HOLON_SKIP_POSTINSTALL: "", HOLON_POSTINSTALL_RUNNING: "", ...env }, encoding: "utf8" });
  assert.equal(run({}).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(log, "utf8")), { args: ["types", "generate", "--quiet", "-p", manifest], cwd: root, guard: "1" });
  rmSync(log);
  for (const env of [{ HOLON_SKIP_POSTINSTALL: "1" }, { HOLON_POSTINSTALL_RUNNING: "1" }, { PATH: "" }]) {
    assert.equal(run(env).status, 0);
    assert.equal(existsSync(log), false);
  }
  rmSync(manifest);
  assert.equal(run({}).status, 0);
  assert.equal(existsSync(log), false);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { unzipSync } from "fflate";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { z } from "zod";
import { generate as generateTarget } from "mcptype/compiler";

// Install the package layout, then fill only its generated slot.
async function generate(identity, contracts, browser = contracts) {
  const request = {
    identity: { name: identity.name, version: identity.version }, requires: identity.requires,
    runtime_specifier: "../runtime.mjs", browser_runtime_specifier: "../browser-runtime.mjs",
    protocol_specifier: "../protocol.js", banner: "holon-generated-apps-v1 app=" + identity.name,
  };
  const generated = { ...(await generateTarget({ ...request, target: "node", contracts })).files, ...(await generateTarget({ ...request, target: "browser", contracts: browser })).files };
  assert.equal(generated["package.json"], undefined);
  const files = Object.fromEntries(Object.entries(generated).map(([name, content]) => ["generated/" + name, content]));
  for (const name of ["runtime.mjs", "browser-runtime.mjs", "browser-validate.mjs", "runtime.d.ts", "browser-runtime.d.ts", "protocol.d.ts", "package.json"]) files[name] = readFileSync(name);
  return files;
}
function writePackage(directory, files) {
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(directory, name)), { recursive: true });
    writeFileSync(join(directory, name), content);
  }
}

const contract = { tools: [
  { name: "get_order", inputSchema: z.toJSONSchema(z.object({ orderId: z.string(), count: z.number().default(5), pair: z.tuple([z.string(), z.number()]).optional() }), { io: "input" }), outputSchema: z.toJSONSchema(z.object({ total: z.number() })) },
  { name: "then", inputSchema: { type: "object", additionalProperties: false } },
  { name: "toJSON", inputSchema: { type: "object", additionalProperties: false } },
  { name: "unknown_output", inputSchema: { type: "object", additionalProperties: false } },
], resources: [{ uri: "orders://summary", outputSchema: z.toJSONSchema(z.object({ total: z.number() })) }] };

test("ordinary NodeNext and Bundler compilation enforces declared app, tool, wire input and result contracts", async t => {
  const root = mkdtempSync(join(tmpdir(), "holon-apps-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, "node_modules/@holon-sh/apps");
  mkdirSync(directory, { recursive: true });
  symlinkSync(resolve("node_modules/zod"), join(root, "node_modules/zod"));
  const nested = JSON.parse(readFileSync("testdata/nested-types.json", "utf8"));
  const dependencies = { orders: contract, "with-hyphen": contract, mysql: nested };
  const files = await generate({ name: "checkout", version: "1", requires: { orders: { name: "orders", version: "1" }, mysql: { name: "mysql", version: "1" } } }, dependencies, { ...dependencies, checkout: contract });
  writePackage(directory, files);
  writeFileSync(join(root, "package.json"), '{"type":"module"}');
  const source = `import { apps, ToolCallError, type Inputs, type Outputs, type InputTypes, type OutputTypes, type Resources } from "@holon-sh/apps";
import {createApps, exposeTools, registerPageTools, type Resources as BrowserResources} from "@holon-sh/apps/browser";
import {z} from "zod";
await registerPageTools({
  move: {description: "Move", inputSchema: z.object({x: z.number()}), execute: ({x}) => x.toFixed()},
  // @ts-expect-error
  wrong: {description: "Wrong", inputSchema: z.object({x: z.number()}), execute: ({y}) => y},
}, {view: {registerTool: () => ({remove() {}})}, signal: new AbortController().signal});
import {createApps as createNodeApps, type EndpointBinding} from "@holon-sh/apps";
const scripted = createNodeApps({orders:{endpoint:"https://orders.example/mcp", authProvider:{token: async () => "token"}}});
(await scripted.orders.tools.get_order({orderId:"script"})).total.toFixed();
await scripted.orders.resources["orders://summary"].watch(async (value) => { value.total.toFixed(); }, {signal: new AbortController().signal});
const oauth: EndpointBinding = {endpoint: new URL("https://orders.example/mcp"), authProvider: {tokens: () => undefined, redirectUrl: undefined, clientMetadata: {}}};
createNodeApps({orders: oauth});
// @ts-expect-error
scripted.orders.resources["orders://summary"].watch((value: string) => {});
// @ts-expect-error
createNodeApps({orders:{endpoint:"https://orders.example/mcp", authProvider:{}}});
// @ts-expect-error
createNodeApps({mysql:{}});
const summary: Resources["orders"]["orders://summary"] = await apps.orders.resources["orders://summary"].read({signal: new AbortController().signal});
summary.total.toFixed();
// @ts-expect-error
apps.mysql.resources["orders://summary"];
const browser = createApps({orders:{endpoint:new URL("https://orders.example/mcp"),installationUID:"installation-one"},"with-hyphen":{endpoint:new URL("https://other.example/mcp")}});
(await browser.orders.tools.get_order({orderId:"browser"})).total.toFixed();
const own = createApps({checkout:{host:{callServerTool: async (params: {name: string; arguments?: Record<string, unknown>}, options?: {signal?: AbortSignal}) => ({content: [], params, options}), readServerResource: async (params: {uri: string}) => ({contents: [], params})}}});
(await own.checkout.tools.get_order({orderId:"host"})).total.toFixed();
const ownSummary: BrowserResources["checkout"]["orders://summary"] = await own.checkout.resources["orders://summary"].read();
ownSummary.total.toFixed();
(await own.checkout.listTools()).tools[0]?.description?.toUpperCase();
if (await exposeTools(own.checkout, {signal: new AbortController().signal, execute: async (name, args) => name + JSON.stringify(args)})) await exposeTools(browser.orders);
// @ts-expect-error
apps.checkout;
// @ts-expect-error
createApps({orders:{}});
// @ts-expect-error
own.checkout.tools.get_order({orderId:1});
const single = createApps({orders:{endpoint:new URL("https://orders.example/mcp")}});
(await single.orders.tools.get_order({orderId:"single"})).total.toFixed();
// @ts-expect-error
single["with-hyphen"];
// @ts-expect-error
createApps({missing:{endpoint:new URL("https://orders.example/mcp")}});
const column = {column: "accounts.id", label: "id"} satisfies InputTypes["mysql"]["select"]["LabeledColumn"];
const direction = "desc" satisfies InputTypes["mysql"]["select"]["Direction"];
const query = {table: "accounts", columns: [column], direction} satisfies Inputs["mysql"]["select"];
const selected = await apps.mysql.tools.select(query);
const value: OutputTypes["mysql"]["select"]["LabeledColumn"] = selected.columns[0];
value.value.toFixed();
// @ts-expect-error
const missing = {column: "id"} satisfies InputTypes["mysql"]["select"]["LabeledColumn"];
// @ts-expect-error
const wrong = {column: "id", label: 1} satisfies InputTypes["mysql"]["select"]["LabeledColumn"];
// @ts-expect-error
const extra = {column: "id", label: "id", extra: true} satisfies InputTypes["mysql"]["select"]["LabeledColumn"];
// @ts-expect-error
const wrongOutput = column satisfies OutputTypes["mysql"]["select"]["LabeledColumn"];
// @ts-expect-error
const wrongDirection = "sideways" satisfies InputTypes["mysql"]["select"]["Direction"];
// @ts-expect-error
type WrongTool = InputTypes["orders"]["get_order"]["LabeledColumn"];
const input: Inputs["orders"]["get_order"] = {orderId: "ord", pair: ["a", 1]};
const output: Outputs["orders"]["get_order"] = {total: 1};
const result = await apps.orders.tools.get_order(input, {signal: new AbortController().signal});
result.total.toFixed();
await apps["with-hyphen"].callTool({name: "then", arguments:{}});
const raw = await apps.orders.callTool({name:"get_order", arguments: {orderId: "ord"}});
if (raw.resultType === "complete" && !raw.isError) raw.structuredContent.total.toFixed();
try { await apps.orders.tools.get_order(input); } catch (error) {
  if (error instanceof ToolCallError) {
    error.app.toUpperCase();
    error.tool.toUpperCase();
    const code: "tool_error" | "input_required" = error.code;
    if (error.result.resultType === "input_required") error.result.requestState?.toUpperCase();
  }
}
// @ts-expect-error
apps.missing;
// @ts-expect-error
apps.orders.tools.missing;
// @ts-expect-error
apps.orders.tools.then;
// @ts-expect-error
apps.orders.tools.toJSON;
// @ts-expect-error
apps.orders.tools.get_order = apps.orders.tools.get_order;
// @ts-expect-error
apps.orders.tools.get_order({orderId: 1});
// @ts-expect-error
apps.orders.tools.get_order({});
// @ts-expect-error
apps.orders.tools.get_order({orderId: "ord", pair: [1, "a"]});
// @ts-expect-error
apps.orders.callTool({name:"get_order", arguments:{orderId: 1}});
// @ts-expect-error
apps.orders.callTool({name:"absent", arguments:{}});
// @ts-expect-error
result.structuredContent.total;
// @ts-expect-error
result.invalid;
// @ts-expect-error
raw.structuredContent.total;
if (raw.resultType === "complete" && !raw.isError) {
  // @ts-expect-error
  raw.structuredContent.invalid;
}
const unknown = await apps.orders.tools.unknown_output({});
// @ts-expect-error
unknown.total;
`;
  writeFileSync(join(root, "check.ts"), source);
  for (const moduleResolution of [ts.ModuleResolutionKind.NodeNext, ts.ModuleResolutionKind.Bundler]) {
    const program = ts.createProgram([join(root, "check.ts")], { noEmit: true, strict: true, target: ts.ScriptTarget.ES2023, moduleResolution, module: moduleResolution === ts.ModuleResolutionKind.NodeNext ? ts.ModuleKind.NodeNext : ts.ModuleKind.ESNext });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: p => p, getNewLine: () => "\n" }));
  }
  const tooling = join(root, "tooling");
  for (const [name, bytes] of Object.entries(unzipSync(readFileSync(join("dist", "cli-tooling-ts-0.1.0.zip"))))) {
    mkdirSync(dirname(join(tooling, name)), { recursive: true });
    writeFileSync(join(tooling, name), bytes);
  }
  writeFileSync(join(root, "check.json"), JSON.stringify({ root, entry: "check.ts", sources: {"check.ts":createHash("sha256").update(source).digest("hex")} }));
  const checked = spawnSync(process.execPath, [join(tooling, "runner.mjs"), "check", join(root, "check.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stderr);
  symlinkSync(resolve("node_modules/typescript"), join(root, "node_modules/typescript"));
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify({compilerOptions:{target:"ES2023",module:"ESNext",moduleResolution:"Bundler",strict:true},files:["check.ts"]}));
  const configured = spawnSync(process.execPath, [join(tooling, "runner.mjs"), "check", join(root, "check.json")], { encoding: "utf8" });
  assert.equal(configured.status, 0, configured.stderr + configured.stdout);
  writeFileSync(join(root, "check.ts"), source + "\nexport const changedAfterExtraction = true;\n");
  const changed = spawnSync(process.execPath, [join(tooling, "runner.mjs"), "verify", join(root, "check.json")], {encoding:"utf8"});
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /refusing to publish stale types/);
  const isolated = join(root, "other-app");
  const isolatedPackage = join(isolated, "node_modules/@holon-sh/apps");
  mkdirSync(isolatedPackage, {recursive:true});
  writePackage(isolatedPackage, await generate({name:"other",version:"1",requires:{}}, {}));
  writeFileSync(join(isolated, "check.ts"), `import {apps} from "@holon-sh/apps";\n// @ts-expect-error\napps.orders;`);
  const isolatedProgram = ts.createProgram([join(isolated, "check.ts")], {noEmit:true,strict:true,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext});
  assert.equal(ts.getPreEmitDiagnostics(isolatedProgram).length, 0, "app-specific imports leaked another application's bindings");
  const { apps } = await import(pathToFileURL(join(directory, "generated/index.js")));
  assert.equal(await apps.orders.tools, apps.orders.tools);
});

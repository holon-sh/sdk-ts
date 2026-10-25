import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, copyFileSync, symlinkSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { temporary, typecheck } from "./helpers.mjs";

// Install the package layout with either the CLI-compiled fixture or the built empty slot.
function install(directory, generated) {
  cpSync(generated, join(directory, "generated"), { recursive: true });
  for (const name of ["runtime.mjs", "browser-runtime.mjs", "browser-validate.mjs", "runtime.d.ts", "browser-runtime.d.ts", "protocol.d.ts", "package.json"]) copyFileSync(name, join(directory, name));
}

test("ordinary NodeNext and Bundler compilation enforces declared app, tool, wire input and result contracts", async t => {
  const root = temporary(t);
  const directory = join(root, "node_modules/holon-sh");
  install(directory, "tests/fixtures/checkout");
  symlinkSync(resolve("node_modules/zod"), join(root, "node_modules/zod"));
  writeFileSync(join(root, "package.json"), '{"type":"module"}');
  const source = `import { apps, ToolCallError, type Inputs, type Outputs, type InputTypes, type OutputTypes, type Resources } from "holon-sh";
import {createApps, exposeTools, registerPageTools, type Resources as BrowserResources} from "holon-sh/browser";
import {z} from "zod";
await registerPageTools({
  move: {description: "Move", inputSchema: z.object({x: z.number()}), execute: ({x}) => x.toFixed()},
  // @ts-expect-error
  wrong: {description: "Wrong", inputSchema: z.object({x: z.number()}), execute: ({y}) => y},
}, {view: {registerTool: () => ({remove() {}})}, signal: new AbortController().signal});
import {createApps as createNodeApps, type EndpointBinding} from "holon-sh";
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
createNodeApps({orders:{}});
const summary: Resources["orders"]["orders://summary"] = await apps.orders.resources["orders://summary"].read({signal: new AbortController().signal});
summary.total.toFixed();
// @ts-expect-error
apps.orders.resources["orders://absent"];
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
const orderId: InputTypes["orders"]["get_order"]["OrderId"] = "ord";
const total: OutputTypes["orders"]["get_order"]["Total"] = 1;
// @ts-expect-error
const wrongId: InputTypes["orders"]["get_order"]["OrderId"] = total;
const input: Inputs["orders"]["get_order"] = {orderId};
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
  typecheck(join(root, "check.ts"));
  const isolated = join(root, "other-app");
  const isolatedPackage = join(isolated, "node_modules/holon-sh");
  install(isolatedPackage, "generated");
  writeFileSync(join(isolated, "check.ts"), `import {apps} from "holon-sh";\n// @ts-expect-error\napps.orders;`);
  typecheck(join(isolated, "check.ts"), [ts.ModuleResolutionKind.NodeNext]);
  const { apps } = await import(pathToFileURL(join(directory, "generated/index.js")));
  assert.equal(await apps.orders.tools, apps.orders.tools);
});

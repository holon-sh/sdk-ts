import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFileSync, readFileSync, cpSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { install, typecheck } from "./helpers.mjs";

test("packed package supports placeholder and generated consumers in NodeNext and Bundler", async t => {
  const { consumer, directory } = install(t);
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

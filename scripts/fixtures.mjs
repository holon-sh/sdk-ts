// Regenerates tests/fixtures/* with the holon CLI's compiler:
//   HOLON=/path/to/holon node scripts/fixtures.mjs   (default: `holon` on PATH; install with `uv tool install --prerelease allow holon-types`)
// The requests mirror the slot layout the CLI writes into node_modules/holon-sh/generated/.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const holon = process.env.HOLON || "holon";
const fixtures = new URL("../tests/fixtures/", import.meta.url).pathname;
const contract = { tools: [
  { name: "get_order",
    inputSchema: { type: "object", properties: { orderId: { $ref: "#/$defs/OrderId" }, count: { type: "number", default: 5 } }, required: ["orderId"], $defs: { OrderId: { type: "string" } } },
    outputSchema: { type: "object", properties: { total: { $ref: "#/$defs/Total" } }, required: ["total"], additionalProperties: false, $defs: { Total: { type: "number" } } },
  },
  { name: "then", inputSchema: { type: "object", additionalProperties: false } },
  { name: "toJSON", inputSchema: { type: "object", additionalProperties: false } },
  { name: "unknown_output", inputSchema: { type: "object", additionalProperties: false } },
], resources: [{ uri: "orders://summary", outputSchema: z.toJSONSchema(z.object({ total: z.number() })) }] };
const dependencies = { orders: contract, "with-hyphen": contract };
const slot = { runtime_specifier: "../runtime.mjs", browser_runtime_specifier: "../browser-runtime.mjs", protocol_specifier: "../protocol.js" };
const cases = {
  checkout: { identity: { name: "checkout", version: "1" }, requires: { orders: { name: "orders", version: "1" } }, node: dependencies, browser: { ...dependencies, checkout: contract } },
  other: { identity: { name: "other", version: "1" }, requires: {}, node: {}, browser: {} },
};
for (const [name, { identity, requires, node, browser }] of Object.entries(cases)) {
  const directory = join(fixtures, name);
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  for (const [target, contracts] of [["node", node], ["browser", browser]]) {
    const request = { target, identity, requires, contracts, ...slot, banner: "holon-generated-apps-v1 app=" + identity.name };
    const file = join(directory, `${target}.request.json`);
    writeFileSync(file, JSON.stringify(request, null, 2) + "\n");
    execFileSync(holon, ["types", "compile", file, "--out", directory], { stdio: "inherit" });
  }
}

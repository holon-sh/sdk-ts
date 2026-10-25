// Regenerates tests/fixtures/checkout with the holon CLI's compiler:
//   HOLON=/path/to/holon node scripts/fixtures.mjs   (default: `holon` on PATH; install with `uv tool install --prerelease allow holon-types`)
// The requests mirror the slot layout the CLI writes into node_modules/holon-sh/generated/.
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const holon = process.env.HOLON || "holon";
const directory = fileURLToPath(new URL("../tests/fixtures/checkout/", import.meta.url));
const contract = { tools: [
  { name: "get_order",
    inputSchema: { type: "object", properties: { orderId: { $ref: "#/$defs/OrderId" }, count: { type: "number", default: 5 } }, required: ["orderId"], $defs: { OrderId: { type: "string" } } },
    outputSchema: { type: "object", properties: { total: { $ref: "#/$defs/Total" } }, required: ["total"], additionalProperties: false, $defs: { Total: { type: "number" } } },
  },
  { name: "then", inputSchema: { type: "object", additionalProperties: false } },
  { name: "toJSON", inputSchema: { type: "object", additionalProperties: false } },
  { name: "unknown_output", inputSchema: { type: "object", additionalProperties: false } },
], resources: [{ uri: "orders://summary", outputSchema: z.toJSONSchema(z.object({ total: z.number() })) }] };
const dependencies = { orders: contract, "with-hyphen": { tools: [contract.tools[1]] } };
const request = {
  identity: { name: "checkout", version: "1" }, requires: { orders: { name: "orders", version: "1" } },
  runtime_specifier: "../runtime.mjs", browser_runtime_specifier: "../browser-runtime.mjs", protocol_specifier: "../protocol.js",
  banner: "holon-generated-apps-v1 app=checkout",
};
const browserContract = { tools: [contract.tools[0]], resources: contract.resources };
rmSync(directory, { recursive: true, force: true });
for (const [target, contracts] of [["node", dependencies], ["browser", { ...dependencies, orders: browserContract, checkout: browserContract }]]) {
  execFileSync(holon, ["types", "compile", "--out", directory], {
    input: JSON.stringify({ ...request, target, contracts }), stdio: ["pipe", "inherit", "inherit"],
  });
}

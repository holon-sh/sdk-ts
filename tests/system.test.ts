import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fromJsonSchema, McpServer } from "@modelcontextprotocol/server";
import { ToolCallError } from "holon-sh/runtime";
import { control, createControl } from "holon-sh/system";
import { serve, temporary, typecheck } from "./helpers.ts";

type Schema = { [keyword: string]: any };
const contract: { tools: Array<{ name: string; description: string; inputSchema: Schema; outputSchema: Schema }> } = JSON.parse(readFileSync(new URL("../packages/node/src/control.json", import.meta.url), "utf8"));
const page = { session: "s-1", app: "shop", traces: [{ traceId: "t-1", start: "2026-11-18T10:00:00Z", method: "tools/call", tool: "checkout", status: "error", errorCode: -32603, durationMs: 12 }] };

// A tool or an argument control.json does not declare is a type error.
// @ts-expect-error
"get_trace" satisfies keyof typeof control.tools;
// @ts-expect-error
({ status: "failed" }) satisfies Parameters<typeof control.tools.get_traces>[0];

// get_traces with the contract's arguments. It fails for since "never", and its result breaks the contract for tool "drifted".
async function serveControl(t: TestContext) {
  const [definition] = contract.tools;
  const calls: unknown[] = [];
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "control", version: "1" });
    server.registerTool(definition.name, { description: definition.description, inputSchema: fromJsonSchema<{ since?: string; tool?: string }>(definition.inputSchema) }, async args => {
      calls.push(args);
      if (args.since === "never") return { isError: true, content: [{ type: "text", text: "since is neither a duration nor a time" }] };
      return { content: [], structuredContent: args.tool === "drifted" ? { ...page, traces: [{ ...page.traces[0], status: "failed" }] } : page };
    });
    return server;
  });
  return { endpoint, calls };
}

test("createControl calls get_traces with typed results checked against control.json", { timeout: 10000 }, async t => {
  const { endpoint, calls } = await serveControl(t);
  const testControl = createControl({ endpoint });
  t.after(() => testControl.close());
  const result = await testControl.tools.get_traces({ since: "24h", limit: 200 });
  result.traces[0].status satisfies "ok" | "error";
  assert.deepEqual(result, page);
  assert.deepEqual(calls, [{ since: "24h", limit: 200 }]);
  await assert.rejects(testControl.tools.get_traces({ since: "never" }), ToolCallError);
  await assert.rejects(testControl.tools.get_traces({ tool: "drifted" }), /Invalid structured output from control\.get_traces/);
});

test("control is the one at CONTROL_MCP_URL", { timeout: 10000 }, async t => {
  const { endpoint } = await serveControl(t);
  process.env.CONTROL_MCP_URL = endpoint;
  t.after(() => { delete process.env.CONTROL_MCP_URL; });
  assert.deepEqual(await control.tools.get_traces({}), page);
});

// The TypeScript the holon CLI generates for a schema, for the keywords control.json uses. Another keyword fails the
// test until it is rendered here.
function typeOf(schema: Schema): string {
  const { type, enum: values, items, properties, required = [], additionalProperties, description, ...rest } = schema;
  assert.deepEqual(rest, {}, `control.json uses keywords this test does not render: ${Object.keys(rest)}`);
  if (values) return values.map((value: unknown) => JSON.stringify(value)).join(" | ");
  if (type === "array") return `Array<${typeOf(items)}>`;
  if (type === "object") {
    assert.equal(additionalProperties, false, "control.json has an open object, which this test does not render");
    return `{ ${Object.entries(properties ?? {}).map(([name, property]) => `${JSON.stringify(name)}${required.includes(name) ? "" : "?"}: ${typeOf(property as Schema)};`).join(" ")} }`;
  }
  const scalar = ({ string: "string", integer: "number", number: "number", boolean: "boolean" } as Record<string, string>)[type];
  assert.ok(scalar, `control.json uses type ${JSON.stringify(type)}, which this test does not render`);
  return scalar;
}

test("control's types are the ones the CLI generates for control.json", t => {
  const root = temporary(t);
  symlinkSync(join(dirname(import.meta.dirname), "node_modules"), join(root, "node_modules"), "dir");
  const source = join(root, "control.mts");
  writeFileSync(source, [
    `import { control } from "holon-sh/system";`,
    "type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;",
    "type Tools = typeof control.tools;",
    `true satisfies Same<keyof Tools, ${contract.tools.map(({ name }) => JSON.stringify(name)).join(" | ")}>;`,
    ...contract.tools.flatMap(({ name, inputSchema, outputSchema }) => [
      `true satisfies Same<Parameters<Tools[${JSON.stringify(name)}]>[0], ${typeOf(inputSchema)}>;`,
      `true satisfies Same<Awaited<ReturnType<Tools[${JSON.stringify(name)}]>>, ${typeOf(outputSchema)}>;`,
    ]),
  ].join("\n"));
  typecheck(source);
});

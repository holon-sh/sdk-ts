import assert from "node:assert/strict";
import { test } from "node:test";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { control, createControl } from "holon-sh/system";
import { serve } from "./helpers.ts";

test("the environment and explicitly bound clients read and validate traces", async t => {
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "control", version: "1" });
    server.registerTool("get_traces", { inputSchema: z.object({ status: z.string().optional() }) }, async ({ status }) => ({
      content: [],
      structuredContent: { session: "dev", traces: [{ traceId: "a1", start: "2026-11-18T12:00:00Z", method: "tools/call", status: status ?? "invalid", durationMs: 12 }] },
    }));
    return server;
  });
  const bound = createControl({ endpoint });
  t.after(() => bound.close());
  const saved = process.env;
  process.env = { ...saved, CONTROL_MCP_URL: endpoint };
  t.after(() => { process.env = saved; });
  const page = await control.tools.get_traces({ status: "error" });
  assert.equal(page.traces[0].status, "error");
  await assert.rejects(bound.tools.get_traces({}), /Invalid structured output from control\.get_traces/);
});

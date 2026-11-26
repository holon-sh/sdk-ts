import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { ProtocolError } from "@modelcontextprotocol/client";
import { CLIENT_CAPABILITIES_META_KEY, createMcpHandler, McpServer, ProtocolError as ServerError, type CallToolResult, type ClientCapabilities } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, type RuntimeClient } from "holon-sh/runtime";

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#extension-identifier
const TASKS = "io.modelcontextprotocol/tasks";
const output = z.object({ size: z.string() });
const contract = { tools: [{ name: "pack", inputSchema: z.toJSONSchema(z.object({ answer: z.enum(["task", "direct"]) })), outputSchema: z.toJSONSchema(output) }] };
const packed = { content: [], structuredContent: { size: "small" } };
const fields = { createdAt: "2026-11-26T15:04:05Z", lastUpdatedAt: "2026-11-26T15:04:05Z", ttlMs: 7200000, pollIntervalMs: 2000 };
const created = { resultType: "task", taskId: "786512e2", status: "working", ...fields };
const question = { size: { method: "elicitation/create", params: { mode: "form", message: "Which size?", requestedSchema: { type: "object", properties: { size: { type: "string" } } } } } };
const states = {
  working: { taskId: "working", status: "working", statusMessage: "Packing", ...fields },
  input_required: { taskId: "input_required", status: "input_required", inputRequests: question, ...fields },
  completed: { taskId: "completed", status: "completed", result: packed, ...fields },
  failed: { taskId: "failed", status: "failed", error: { code: -32603, message: "Packing failed" }, ...fields },
  cancelled: { taskId: "cancelled", status: "cancelled", ...fields },
};
const served = { _meta: { "io.modelcontextprotocol/serverInfo": { name: "packer", version: "1" } } };
const answer = { size: { action: "accept", content: { size: "small" } } } as const;

interface Row {
  name: string;
  act: (app: RuntimeClient) => Promise<unknown>;
  requests: string[];
  returns: unknown;
}

const rows: Row[] = [
  {
    name: "an ordinary call declares no tasks",
    act: app => app.tools.pack!({ answer: "direct" }),
    requests: ["tools/call pack undeclared"],
    returns: { size: "small" },
  },
  {
    name: "a call that asks for a task gets the task as the server sent it",
    act: app => app.startTask({ name: "pack", arguments: { answer: "task" } }),
    requests: ["tools/call pack declared"],
    returns: { ...created, content: [], ...served },
  },
  {
    name: "a call that asks for a task gets the tool result when the server answers directly",
    act: app => app.startTask({ name: "pack", arguments: { answer: "direct" } }),
    requests: ["tools/call pack declared"],
    returns: { resultType: "complete", ...packed, ...served },
  },
  ...Object.values(states).map(state => ({
    name: `getTask returns the ${state.status} task as the server sent it`,
    act: (app: RuntimeClient) => app.getTask(state.taskId),
    requests: [`tasks/get ${state.taskId} declared`],
    returns: { ...state, ...served },
  })),
  {
    name: "updateTask sends the answers",
    act: app => app.updateTask("input_required", answer),
    requests: [`tasks/update input_required declared ${JSON.stringify(answer)}`],
    returns: served,
  },
  {
    name: "cancelTask asks the server to cancel",
    act: app => app.cancelTask("working"),
    requests: ["tasks/cancel working declared"],
    returns: served,
  },
];

function packer(t: TestContext) {
  const received: string[] = [];
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "packer", version: "1" }, { capabilities: { extensions: { [TASKS]: {} } } });
    server.registerTool("pack", { inputSchema: z.object({ answer: z.enum(["task", "direct"]) }) }, async ({ answer }) => (answer === "task" ? created : packed) as CallToolResult);
    server.server.setRequestHandler("tasks/get", { params: z.object({ taskId: z.string() }) }, async ({ taskId }) => {
      if (!Object.hasOwn(states, taskId)) throw new ServerError(-32602, "Task not found");
      return states[taskId as keyof typeof states];
    });
    server.server.setRequestHandler("tasks/update", { params: z.object({ taskId: z.string() }) }, async () => ({}));
    server.server.setRequestHandler("tasks/cancel", { params: z.object({ taskId: z.string() }) }, async () => ({}));
    return server;
  }, { legacy: "reject" });
  const fetch = async (input: Parameters<typeof globalThis.fetch>[0], init?: RequestInit) => {
    const request = new Request(input, init);
    const body = request.method === "POST" ? await request.clone().json() as { method?: string; params?: { inputResponses?: unknown; _meta?: Record<string, ClientCapabilities> } } : undefined;
    if (body?.method && body.method !== "server/discover") {
      const declared = body.params?._meta?.[CLIENT_CAPABILITIES_META_KEY]?.extensions?.[TASKS] ? "declared" : "undeclared";
      const responses = body.params?.inputResponses ? ` ${JSON.stringify(body.params.inputResponses)}` : "";
      received.push(`${body.method} ${request.headers.get("mcp-name")} ${declared}${responses}`);
    }
    return handler.fetch(request);
  };
  const { packer: app } = createApps({ name: "shop", version: "1" }, { packer: contract }, { packer: { endpoint: "http://packer.test/mcp", fetch } });
  t.after(async () => {
    await app.close();
    await handler.close();
  });
  return { app, received };
}

for (const row of rows) {
  test(`tasks: ${row.name}`, async t => {
    const { app, received } = packer(t);
    assert.deepEqual(await row.act(app), row.returns);
    assert.deepEqual(received, row.requests);
  });
}

test("tasks: an unknown task id is the server's error", async t => {
  const { app, received } = packer(t);
  await assert.rejects(app.getTask("missing"), error => error instanceof ProtocolError && error.code === -32602);
  assert.deepEqual(received, ["tasks/get missing declared"]);
});

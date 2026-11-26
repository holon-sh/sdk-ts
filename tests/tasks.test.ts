import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { CLIENT_CAPABILITIES_META_KEY, createMcpHandler, McpServer, type CallToolResult, type ClientCapabilities } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps, type RuntimeClient } from "holon-sh/runtime";
import { EXTENSION } from "holon-sh/ext/files";

// https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md#extension-identifier
const TASKS = "io.modelcontextprotocol/tasks";
const packed = { content: [], structuredContent: { size: "small" } };
const task = { taskId: "786512e2", createdAt: "2026-11-26T15:04:05Z", lastUpdatedAt: "2026-11-26T15:04:05Z", ttlMs: 7200000, pollIntervalMs: 2000 };
const created = { resultType: "task", status: "working", ...task };
const asking = { status: "input_required", inputRequests: { size: { method: "elicitation/create", params: { mode: "form", message: "Which size?", requestedSchema: { type: "object", properties: { size: { type: "string" } } } } } }, ...task };
const served = { _meta: { "io.modelcontextprotocol/serverInfo": { name: "packer", version: "1" } } };
const answer = { size: { action: "accept", content: { size: "small" } } } as const;
const label = "label\n";
const file = { name: "label.txt", mimeType: "text/plain", size: label.length, path: "/label.txt", credentials: "omit" };
const labelled = { ...task, taskId: "9b2f4c1d", status: "completed", result: { content: [], _meta: { [EXTENSION]: { downloads: [file] } } } };

interface Row {
  name: string;
  act: (app: RuntimeClient) => Promise<unknown>;
  request: string;
  returns: unknown;
}

const rows: Row[] = [
  {
    name: "startTask returns the task as the server sent it",
    act: app => app.startTask({ name: "pack", arguments: { answer: "task" } }),
    request: "tools/call pack declared",
    returns: { ...created, content: [], ...served },
  },
  {
    name: "startTask returns the tool result when the server answers directly",
    act: app => app.startTask({ name: "pack", arguments: { answer: "direct" } }),
    request: "tools/call pack declared",
    returns: { resultType: "complete", ...packed, ...served },
  },
  {
    name: "getTask returns the task as the server sent it",
    act: app => app.getTask(task.taskId),
    request: `tasks/get ${task.taskId} declared`,
    returns: { ...asking, ...served },
  },
  {
    name: "getTask gives a completed task's files as downloads",
    act: async app => {
      const got = await app.getTask(labelled.taskId);
      return got.status === "completed" && (await got.result.downloads?.[0]?.blob())?.text();
    },
    request: `tasks/get ${labelled.taskId} declared`,
    returns: label,
  },
  {
    name: "callTool rejects a task it did not ask for",
    act: app => app.callTool({ name: "pack", arguments: { answer: "task" } }).then(() => "resolved", () => "rejected"),
    request: "tools/call pack undeclared",
    returns: "rejected",
  },
  {
    name: "updateTask sends the answers",
    act: app => app.updateTask(task.taskId, answer),
    request: `tasks/update ${task.taskId} declared ${JSON.stringify(answer)}`,
    returns: served,
  },
  {
    name: "cancelTask asks the server to cancel",
    act: app => app.cancelTask(task.taskId),
    request: `tasks/cancel ${task.taskId} declared`,
    returns: served,
  },
];

function packer(t: TestContext) {
  const received: string[] = [];
  const params = z.object({ taskId: z.string() });
  const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "packer", version: "1" }, { capabilities: { extensions: { [EXTENSION]: {} } } });
    server.registerTool("pack", { inputSchema: z.object({ answer: z.enum(["task", "direct"]) }) }, async ({ answer }) => (answer === "task" ? created : packed) as CallToolResult);
    server.server.setRequestHandler("tasks/get", { params }, async ({ taskId }) => taskId === labelled.taskId ? labelled : asking);
    server.server.setRequestHandler("tasks/update", { params }, async () => ({}));
    server.server.setRequestHandler("tasks/cancel", { params }, async () => ({}));
    return server;
  });
  const fetch = async (input: Parameters<typeof globalThis.fetch>[0], init?: RequestInit) => {
    const request = new Request(input, init);
    if (request.url.endsWith(file.path)) return new Response(label);
    const body = request.method === "POST" ? await request.clone().json() as { method?: string; params?: { inputResponses?: unknown; _meta?: Record<string, ClientCapabilities> } } : undefined;
    if (body?.method && body.method !== "server/discover") {
      const declared = body.params?._meta?.[CLIENT_CAPABILITIES_META_KEY]?.extensions?.[TASKS] ? "declared" : "undeclared";
      const responses = body.params?.inputResponses ? ` ${JSON.stringify(body.params.inputResponses)}` : "";
      received.push(`${body.method} ${request.headers.get("mcp-name")} ${declared}${responses}`);
    }
    return handler.fetch(request);
  };
  const { packer: app } = createApps({ name: "shop", version: "1" }, { packer: null }, { packer: { endpoint: "http://packer.localhost/mcp", fetch } });
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
    assert.deepEqual(received, [row.request]);
  });
}

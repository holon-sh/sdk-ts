import { test } from "node:test";
import assert from "node:assert/strict";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createApps } from "holon-sh/runtime";
import { streamAnswer } from "holon-sh/context";
import { serve, serveLegacy } from "./helpers.ts";

const identity = { name: "page", version: "1" };

test("a streamed answer reaches the caller part by part while the call runs, then its result", { timeout: 10000 }, async t => {
  const output = z.object({ words: z.number() });
  let heard!: () => void;
  const first = new Promise<void>(resolve => { heard = resolve; });
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "chat", version: "1" });
    server.registerTool("chat", { inputSchema: z.object({ prompt: z.string() }), outputSchema: output }, async ({ prompt }, ctx) => {
      const send = streamAnswer<string>(ctx);
      const [head, ...rest] = prompt.split(" ");
      await send(head!);
      // The rest waits until the caller has the first part, which it can only have if parts are not held back.
      await first;
      for (const word of rest) await send(word);
      return { content: [{ type: "text", text: prompt }], structuredContent: { words: rest.length + 1 } };
    });
    return server;
  });
  const contract = { tools: [{ name: "chat", inputSchema: {}, outputSchema: z.toJSONSchema(output) }] };
  const { chat } = createApps(identity, { chat: contract }, { chat: { endpoint } });
  t.after(() => chat!.close());
  const answer = chat!.streamTool({ name: "chat", arguments: { prompt: "a b c" } });
  const parts: unknown[] = [];
  for await (const part of answer) {
    parts.push(part);
    heard();
  }
  assert.deepEqual(parts, ["a", "b", "c"]);
  assert.deepEqual((await answer.result).structuredContent, { words: 3 });
  await assert.rejects(async () => { for await (const _ of chat!.streamTool({ name: "absent", arguments: {} })); }, /Unknown tool chat\.absent/);
});

// A 2026 client cancels by closing the call's stream; a 2025 one sends notifications/cancelled and the session stays open.
test("leaving the loop cancels the call, and the server's next send rejects", { timeout: 10000 }, async t => {
  for (const host of [serve, serveLegacy]) {
    let stopped!: () => void;
    const stop = new Promise<void>(resolve => { stopped = resolve; });
    const { endpoint } = await host(t, () => {
      const server = new McpServer({ name: "kernel", version: "1" });
      server.registerTool("run", { inputSchema: z.object({}) }, async (_, ctx) => {
        const send = streamAnswer<number>(ctx);
        try {
          for (let line = 0; ; line++) {
            await send(line);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } finally { stopped(); }
      });
      return server;
    });
    const { kernel } = createApps(identity, { kernel: null }, { kernel: { endpoint } });
    t.after(() => kernel!.close());
    const answer = kernel!.streamTool({ name: "run", arguments: {} });
    for await (const part of answer) if (part === 2) break;
    await stop;
    await assert.rejects(answer.result);
  }
});

test("parts travel as MCP progress of the call, and a caller that asks for none still gets the result", { timeout: 10000 }, async t => {
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "chat", version: "1" });
    server.registerTool("chat", { inputSchema: z.object({}) }, async (_, ctx) => {
      const send = streamAnswer(ctx);
      await send("a");
      await send({ cell: 1, text: "b" });
      return { content: [{ type: "text", text: "ab" }] };
    });
    return server;
  });
  const client = new Client(identity, { versionNegotiation: { mode: "auto" } });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  t.after(() => client.close());
  const progress: unknown[] = [];
  await client.callTool({ name: "chat", arguments: {} }, { onprogress: notification => progress.push(notification) });
  assert.deepEqual(progress, [{ progress: 1, _meta: { "sh.holon/partial": "a" } }, { progress: 2, _meta: { "sh.holon/partial": { cell: 1, text: "b" } } }]);
  assert.deepEqual((await client.callTool({ name: "chat", arguments: {} })).content, [{ type: "text", text: "ab" }]);
});

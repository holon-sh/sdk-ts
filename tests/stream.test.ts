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
  const first = Promise.withResolvers<void>();
  const { endpoint } = await serve(t, () => {
    const server = new McpServer({ name: "chat", version: "1" });
    server.registerTool("chat", { inputSchema: z.object({}) }, async (_, ctx) => {
      const send = streamAnswer(ctx);
      await send("a");
      // The second part waits until the caller has the first, which it can only have if parts are not held back.
      await first.promise;
      await send("b");
      return { content: [{ type: "text", text: "ab" }] };
    });
    return server;
  });
  const { chat } = createApps(identity, { chat: null }, { chat: { endpoint } });
  t.after(() => chat!.close());
  const answer = chat!.streamTool({ name: "chat", arguments: {} });
  const parts: unknown[] = [];
  for await (const part of answer) {
    parts.push(part);
    first.resolve();
  }
  assert.deepEqual(parts, ["a", "b"]);
  assert.deepEqual((await answer.result).content, [{ type: "text", text: "ab" }]);
});

// A 2026 client cancels by closing the call's stream; a 2025 one sends notifications/cancelled and the session stays open.
test("leaving the loop cancels the call, and the server's next send rejects", { timeout: 10000 }, async t => {
  for (const host of [serve, serveLegacy]) {
    const stop = Promise.withResolvers<void>();
    const { endpoint } = await host(t, () => {
      const server = new McpServer({ name: "kernel", version: "1" });
      server.registerTool("run", { inputSchema: z.object({}) }, async (_, ctx) => {
        const send = streamAnswer(ctx);
        try {
          for (let line = 0; ; line++) {
            await send(line);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } finally { stop.resolve(); }
      });
      return server;
    });
    const { kernel } = createApps(identity, { kernel: null }, { kernel: { endpoint } });
    t.after(() => kernel!.close());
    const answer = kernel!.streamTool({ name: "run", arguments: {} });
    for await (const part of answer) if (part === 2) break;
    await stop.promise;
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

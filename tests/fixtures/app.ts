import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { createEvents } from "holon-sh/ext/events";
import { z } from "zod";

const events = createEvents();
events.event("ticked", { inputSchema: z.object({}), payloadSchema: z.object({}) });

export default createMcpHandler(() => {
  const server = new McpServer({ name: "app", version: "1.0.0" });
  server.registerTool("hello", {}, () => ({ content: [{ type: "text", text: "hello" }] }));
  server.registerTool("wait", {}, ctx => new Promise((_, reject) => {
    ctx.mcpReq.signal.addEventListener("abort", () => reject(ctx.mcpReq.signal.reason));
    console.log("waiting");
  }));
  events.serve(server);
  return server;
});

export const frontend = new URL("./web/", import.meta.url);

import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";

export default createMcpHandler(() => {
  const server = new McpServer({ name: "app", version: "1.0.0" });
  server.registerTool("hello", {}, () => ({ content: [{ type: "text", text: "hello" }] }));
  server.registerTool("wait", {}, ctx => new Promise((_, reject) => {
    ctx.mcpReq.signal.addEventListener("abort", () => reject(ctx.mcpReq.signal.reason));
    console.log("waiting");
  }));
  return server;
});

export const frontend = new URL("./web/", import.meta.url);

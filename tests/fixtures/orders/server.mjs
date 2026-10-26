// Literal schemas preserve $ref and names that SDK schema builders may rewrite.
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const tools = [
  {
    name: "get_order",
    inputSchema: { type: "object", properties: { orderId: { $ref: "#/$defs/OrderId" }, count: { type: "number", default: 5 } }, required: ["orderId"], $defs: { OrderId: { type: "string" } } },
    outputSchema: { type: "object", properties: { total: { $ref: "#/$defs/Total" } }, required: ["total"], additionalProperties: false, $defs: { Total: { type: "number" } } },
  },
  ...["then", "toJSON", "unknown_output"].map(name => ({ name, inputSchema: { type: "object", additionalProperties: false } })),
];
const resources = [{ name: "summary", uri: "orders://summary", _meta: { "sh.holon/outputSchema": { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties: { total: { type: "number" } }, required: ["total"], additionalProperties: false } } }];

export const server = createServer(async (req, res) => {
  if (req.url !== "/mcp") return res.writeHead(404).end();
  if (req.method !== "POST") return res.writeHead(405).end();
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = JSON.parse(Buffer.concat(chunks).toString());
  if (request.id === undefined) return res.writeHead(202).end();
  const result = {
    initialize: { protocolVersion: request.params?.protocolVersion, capabilities: { tools: {}, resources: {} }, serverInfo: { name: "orders", version: "1" } },
    "tools/list": { tools },
    "resources/list": { resources },
  }[request.method];
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ jsonrpc: "2.0", id: request.id, ...(result ? { result } : { error: { code: -32601, message: "Method not found" } }) }));
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(3999, "127.0.0.1");

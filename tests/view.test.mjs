import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appView, VIEW_MIME_TYPE } from "holon-sh/view";
import { McpServer } from "@modelcontextprotocol/server";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";

test("appView serves one build of the page for the life of the process", async () => {
  const directory = await mkdtemp(join(tmpdir(), "holon-view-"));
  const file = join(directory, "index.html");
  await writeFile(file, "<html>one</html>");
  const server = new McpServer({ name: "site", version: "1" });
  server.registerResource(...appView("Site", "ui://site/index.html", file, { csp: { connectDomains: ["https://api.example"] } }));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { resources } = await client.listResources();
  assert.deepEqual(resources.map(({ name, uri, mimeType, _meta }) => ({ name, uri, mimeType, _meta })), [
    { name: "Site", uri: "ui://site/index.html", mimeType: VIEW_MIME_TYPE, _meta: { ui: { csp: { connectDomains: ["https://api.example"], resourceDomains: [] } } } },
  ]);
  const first = await client.readResource({ uri: "ui://site/index.html" });
  assert.deepEqual(first.contents, [{ uri: "ui://site/index.html", mimeType: VIEW_MIME_TYPE, text: "<html>one</html>" }]);
  await writeFile(file, "<html>two</html>");
  const second = await client.readResource({ uri: "ui://site/index.html" }, { cacheMode: "bypass" });
  assert.equal(second.contents[0].text, "<html>one</html>");
  await client.close();
  const missing = new McpServer({ name: "unbuilt", version: "1" });
  missing.registerResource(...appView("Site", "ui://site/index.html", join(directory, "absent.html")));
  const [missingClientTransport, missingServerTransport] = InMemoryTransport.createLinkedPair();
  const unbuilt = new Client({ name: "test", version: "1" });
  await Promise.all([missing.connect(missingServerTransport), unbuilt.connect(missingClientTransport)]);
  await assert.rejects(unbuilt.readResource({ uri: "ui://site/index.html" }), /ENOENT|no such file/);
  await unbuilt.close();
});

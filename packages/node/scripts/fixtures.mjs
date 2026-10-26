// The only fixture refresh path: HOLON=/path/to/holon npm run fixtures.
// Uses public generation against a local literal MCP server; no package install or network is needed.
import { execFile } from "node:child_process";
import { once } from "node:events";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { server } from "../../../tests/fixtures/orders/server.mjs";

const holon = process.env.HOLON ? resolve(process.env.HOLON) : "holon";
const directory = fileURLToPath(new URL("../../../tests/fixtures/checkout/", import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), "holon-checkout-"));
try {
  const runtime = join(consumer, "node_modules/holon-sh");
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "checkout", version: "1", type: "module", dependencies: { "holon-sh": "*" } }));
  cpSync(new URL("../", import.meta.url), runtime, { recursive: true });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const endpoint = `http://127.0.0.1:${server.address().port}/mcp`;
  const { stdout, stderr } = await promisify(execFile)(holon, ["types", "generate", `orders=${endpoint}`, `with-hyphen=${endpoint}`], { cwd: consumer, timeout: 30000 });
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  rmSync(directory, { recursive: true, force: true });
  cpSync(join(runtime, "generated"), directory, { recursive: true });
} finally {
  server.closeAllConnections();
  await new Promise(done => server.close(done));
  rmSync(consumer, { recursive: true, force: true });
}

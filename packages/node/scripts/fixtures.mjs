// Regenerates tests/fixtures/checkout with the holon CLI's compiler:
//   HOLON=/path/to/holon npm run fixtures   (default: `holon` on PATH; install with `uv tool install --prerelease allow holon-types`)
// The request mirrors the slot the CLI writes into node_modules/holon-sh/generated/.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const holon = process.env.HOLON || "holon";
const directory = fileURLToPath(new URL("../../../tests/fixtures/checkout/", import.meta.url));
const input = readFileSync(join(directory, "node.request.json"), "utf8");
rmSync(directory, { recursive: true, force: true });
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, "node.request.json"), input);
execFileSync(holon, ["types", "compile", "--out", directory], { input, stdio: ["pipe", "inherit", "inherit"] });

import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
// tsc never deletes output whose source is gone, so every build starts from an empty dist.
rmSync(new URL("dist", root), { recursive: true, force: true });
const manifest = import.meta.resolve("typescript/package.json");
const tsc = fileURLToPath(new URL(JSON.parse(readFileSync(new URL(manifest), "utf8")).bin.tsc, manifest));
execFileSync(process.execPath, [tsc, "--build", fileURLToPath(root)], { stdio: "inherit" });
// The repository README is the package README.
copyFileSync(new URL("../../README.md", root), new URL("README.md", root));

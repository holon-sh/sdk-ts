import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const version = "0.0.6";
const archive = `mcptype-${version}.tgz`;
const base = `https://github.com/hughhan1/mcptype/releases/download/v${version}`;
async function download(name) {
  const response = await fetch(`${base}/${name}`);
  if (!response.ok) throw new Error(`Downloading ${name}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const [bytes, sums] = await Promise.all([download(archive), download("SHA256SUMS")]);
const expected = sums.toString("utf8").split("\n").map(line => line.trim().split(/\s+/)).find(([, name]) => name?.replace(/^\*/, "") === archive)?.[0];
if (!expected || createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error(`Checksum mismatch for ${archive}`);
await mkdir(new URL("../vendor/", import.meta.url), { recursive: true });
await writeFile(new URL(`../vendor/${archive}`, import.meta.url), bytes);

// Release archives combine platform binaries; local development archives may contain
// only the current platform. Pin the verified release bytes before npm ci.
const lockURL = new URL("../package-lock.json", import.meta.url);
const lock = JSON.parse(await readFile(lockURL, "utf8"));
const binding = lock.packages["node_modules/mcptype"];
if (binding.version !== version || binding.resolved !== `file:vendor/${archive}`) throw new Error("mcptype lockfile version does not match the release");
binding.integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
await writeFile(lockURL, JSON.stringify(lock, null, 2) + "\n");

// Regeneration is best effort: installing this package must never require the CLI.
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.env.HOLON_SKIP_POSTINSTALL !== "1" && process.env.HOLON_POSTINSTALL_RUNNING !== "1") {
  try {
    let directory = resolve(process.env.INIT_CWD || process.cwd());
    for (;;) {
      const manifest = join(directory, "holon.yaml");
      if (existsSync(manifest)) {
        spawnSync("holon", ["types", "generate", "--quiet", "-p", manifest], {
          cwd: directory,
          env: { ...process.env, HOLON_POSTINSTALL_RUNNING: "1" },
          stdio: "ignore",
          timeout: 120_000,
        });
        break;
      }
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  } catch {
    // The user can run `holon types generate` after installation.
  }
}

import { copyFileSync, rmSync } from "node:fs";

// tsc never deletes output whose source is gone, so every build starts from an empty dist.
rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
// The repository README is the package README.
copyFileSync(new URL("../../../README.md", import.meta.url), new URL("../README.md", import.meta.url));

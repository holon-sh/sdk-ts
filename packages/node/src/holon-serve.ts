#!/usr/bin/env node
import { load, serve } from "./serve.js";

const [entry, ...rest] = process.argv.slice(2);
if (!entry || rest.length) {
  console.error("Usage: holon-serve <entry>");
  process.exit(2);
}
await serve(await load(entry));

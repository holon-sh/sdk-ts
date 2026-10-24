# @holon/apps

Typed MCP clients, browser helpers, view resources, and static contract extraction.
The runtime is bundled and has no runtime package dependencies. Node.js 22 or newer is required for the Node and extraction entry points.

This repository prepares `@holon/apps` 0.1.0 for publication. Nothing is published by its CI workflow.

```sh
npm install @holon/apps
holon types generate
```

The `holon` CLI fills the package's `generated/` slot using your application's contracts. Each application needs its own resolved package directory. The installed placeholder exports empty `Apps`, `Inputs`, `Outputs`, and `Resources` types until generation runs.

```ts
import { apps } from "@holon/apps";
import { setDefaultBinding, type Binding } from "@holon/apps/runtime";

setDefaultBinding(name => ({ endpoint: `https://${name}.example/mcp` }));
// After generation: await apps.orders.tools.get_order({ id: "123" });
```

Without an explicit binding or default resolver, clients use `<NAME>_MCP_URL` (uppercase, with hyphens changed to underscores). Explicit clients can be constructed with `createApps` from `@holon/apps` or `@holon/apps/browser`. The browser entry point also exports `exposeTools` and `registerPageTools` for WebMCP and MCP Apps hosts.

`ToolCallError` distinguishes tool failures and input-required results. `callTool` preserves the full MCP result; generated `tools` methods validate inputs and structured outputs and return the structured output directly.

Use `appView` from `@holon/apps/view` to register an HTML resource:

```ts
import { appView } from "@holon/apps/view";
server.registerResource(...appView("Dashboard", "ui://dashboard/index.html", new URL("./dist/index.html", import.meta.url)));
```

`extract` from `@holon/apps/extract` statically analyzes an MCP handler without executing application initialization:

```ts
import { extract } from "@holon/apps/extract";
const contract = extract(process.cwd(), "server.ts");
```

Installation runs a best-effort `holon types generate --quiet -p <manifest>` if a `holon.yaml` exists above `INIT_CWD` and `holon` is available on PATH. Missing commands and generation failures never fail installation. Set `HOLON_SKIP_POSTINSTALL=1` to disable it.

## Development

Download the `mcptype-0.0.6.tgz` binding from the `hughhan1/mcptype` v0.0.6 GitHub release into `vendor/` before installing development dependencies:

```sh
node scripts/fetch-mcptype.mjs
npm ci
npm test
npm pack
```

`npm run build` also produces `dist/cli-tooling-ts-0.1.0.zip`, containing the standalone `runner.mjs`, TypeScript standard declarations under `lib/`, version metadata, and third-party notices. The runner supports `extract`, `check`, and `verify`; it has no dependency on an installed CLI or private host SDK.

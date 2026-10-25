# @holon-sh/apps

Typed MCP clients, browser helpers, and view resources.
The runtime is bundled and has no runtime package dependencies. Node.js 22 or newer is required for the Node entry points.

This repository prepares `@holon-sh/apps` 0.1.0 for publication. Nothing is published by its CI workflow; dev builds are published only by a manually dispatched workflow (see [Dev releases](#dev-releases)).

```sh
npm install @holon-sh/apps
holon types generate
```

The `holon` CLI fills the package's `generated/` slot using your application's contracts. Each application needs its own resolved package directory. The installed placeholder exports empty `Apps`, `Inputs`, `Outputs`, and `Resources` types until generation runs.

```ts
import { apps } from "@holon-sh/apps";
import { setDefaultBinding, type Binding } from "@holon-sh/apps/runtime";

setDefaultBinding(name => ({ endpoint: `https://${name}.example/mcp` }));
// After generation: await apps.orders.tools.get_order({ id: "123" });
```

Without an explicit binding or default resolver, clients use `<NAME>_MCP_URL` (uppercase, with hyphens changed to underscores). Explicit clients can be constructed with `createApps` from `@holon-sh/apps` or `@holon-sh/apps/browser`. The browser entry point also exports `exposeTools` and `registerPageTools` for WebMCP and MCP Apps hosts.

`ToolCallError` distinguishes tool failures and input-required results. `callTool` preserves the full MCP result; generated `tools` methods validate inputs and structured outputs and return the structured output directly.

Use `appView` from `@holon-sh/apps/view` to register an HTML resource:

```ts
import { appView } from "@holon-sh/apps/view";
server.registerResource(...appView("Dashboard", "ui://dashboard/index.html", new URL("./dist/index.html", import.meta.url)));
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

Contract extraction and type checking belong to the `holon` CLI, which carries its own tooling; this package ships only the runtime.

## Dev releases

`.github/workflows/publish-dev.yml` publishes `@holon-sh/apps@0.1.0-dev.<run number>` to npm under the `dev` dist-tag (never `latest`). It runs only when dispatched by hand, rewrites the version inside the job without committing it, and prints the exact install line in the job summary.

One-time setup on npmjs.com: publish the first version with an automation token stored as the `NPM_TOKEN` repository secret, then add a trusted publisher to the package (owner `holon-sh`, repository `sdk-ts`, workflow `publish-dev.yml`, no environment) and remove the secret. The workflow uses OIDC trusted publishing when no `NPM_TOKEN` is set.

```sh
gh workflow run publish-dev.yml
```

Consumers install a dev build with `npm install @holon-sh/apps@dev` or the exact version printed in the job summary, e.g. `npm install @holon-sh/apps@0.1.0-dev.12`.

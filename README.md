# Holon TypeScript SDK

[![CI](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/en/download)
[![MIT License](https://img.shields.io/badge/license-MIT-green)](https://github.com/holon-sh/sdk-ts/blob/main/LICENSE)

This repository contains the Node.js runtime for [`holon`](https://github.com/holon-sh/cli).

## Install

```sh
npm install holon-sh@dev
npm install -D holon-types
```

`holon-types` is the `holon` CLI. `holon types check` brings its own TypeScript compiler and uses the project's `typescript` when one is installed.

## Invoking MCP Servers

The Holon TypeScript SDK allows generation of type-safe MCP clients. See [Example](https://github.com/holon-sh/cli#example) for an explanation, or [Dependencies](https://github.com/holon-sh/cli#dependencies) to understand dependency resolution.

### Type-checking MCP invocations

```sh
npx holon types check
```

<details open>
<summary><h3>Call a tool</h3></summary>

```ts
import { apps } from "holon-sh";

export async function greet(name: string): Promise<string> {
  const greeting = await apps.bar.tools.greet({ name }, { timeout: 5000 });
  return greeting.result;
}
```

Arguments are validated before sending; the result is validated against the output schema and returned.

</details>

<details open>
<summary><h3>Handle errors</h3></summary>

```ts
import { ToolCallError, apps } from "holon-sh";

try {
  await apps.bar.tools.greet({ name: "world" });
} catch (error) {
  if (!(error instanceof ToolCallError)) throw error;
  error.code;   // "tool_error" | "input_required"
  error.result; // the original MCP result
}
```

</details>

<details open>
<summary><h3>Read the whole result</h3></summary>

`callTool` returns the full MCP result instead of throwing:

```ts
const result = await apps.bar.callTool({ name: "greet", arguments: { name: "world" } });
if (result.resultType === "input_required") {
  // call again with inputResponses and requestState
} else if (result.isError) {
  // inspect result.content
} else {
  result.structuredContent; // typed as Outputs["bar"]["greet"]
}
```

</details>

<details open>
<summary><h3>Read a resource</h3></summary>

A provider types a JSON resource by registering it with `mimeType: "application/json"` and an `"sh.holon/outputSchema"` JSON Schema in its `_meta`, as the `orders` server in `tests/fixtures` does. The client then offers `read` and `watch`:

```ts
const summary = await apps.orders.resources["orders://summary"].read();

const controller = new AbortController();
await apps.orders.resources["orders://summary"].watch(value => console.log(value.total), {
  signal: controller.signal,
});
```

`watch` calls back with the current value, then on every update, until the signal aborts. It needs an endpoint binding and a server that supports resource subscriptions.

</details>

## Serve an [MCP App](https://modelcontextprotocol.io/extensions/apps/overview) view

```ts
import { appView } from "holon-sh/view";

server.registerResource(
  ...appView("Foo", "ui://foo/index.html", new URL("./dist/index.html", import.meta.url), {
    csp: { connectDomains: ["https://bar.example.com"] },
  }),
);
```

The page itself uses [`holon-ui`](https://github.com/holon-sh/sdk-ui).

## Function apps

`holon-sh/app` turns typed functions into ordinary MCP tools and JSON resources.
The CLI extracts schemas without importing your server. Run `holon types generate`
after installing dependencies and before starting or building the app.

```ts
import { createApp, resource, tool } from "holon-sh/app";

let count = 0;
const state = resource("counter://state", () => ({ count }));
const show = tool({ annotations: { readOnlyHint: true } }, () => ({ count }));
const add = tool({ changes: [state] }, ({ amount }: { amount: number }) => {
  count += amount;
  return { count };
});

export default createApp({ name: "example.com/counter", version: "1.0.0" }, {
  tools: { show, add }, resources: { state },
  views: new URL("./dist/views.json", import.meta.url),
});
```

The second callback argument is the native MCP `ServerContext`. `changes` publishes
resource updates after successful calls; it does not authorize or make a write
transactional. Other writers must publish their own updates. The returned handler
has the SDK's `fetch`, `notify`, and `close`, plus `createServer` for stdio hosts.

Use `holon-ui/react` to declare the presentation and `holon-ui/build` to emit both
the static frontend and self-contained MCP App. The resulting `views.json` supplies
tool/resource associations and native MCP Apps metadata. Server code stays on the
server. Omit `views` for an app without a UI.

Function inference supports JSON object arguments and results, including nested
objects, arrays, optional properties and unions. Unsupported types fail extraction.
For templates, tasks, non-JSON outputs, or dynamically composed catalogs, keep the
native MCP APIs. Existing generated clients and `appView` remain available. An
explicit `contract` can supply schemas when another producer owns the contract;
`configure` adds native registrations in that mode.

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

## Other entry points

| Import | Exports |
|---|---|
| `holon-sh/runtime` | What the generated module calls: `createApps(identity, contracts, bindings?, options?)`, `bindApps`, `ToolCallError`, and `setDefaultBinding` for hosts that bind every app at startup. Apps use the generated module instead. |
| `holon-sh/protocol` | Types only: `ToolClient`, `ToolResult`, `CallOptions`, `CallMetadata`, `AuthProvider`, `ToolCallError`. |

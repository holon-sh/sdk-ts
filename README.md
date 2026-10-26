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

Generate `node_modules/holon-sh/generated/` from the project's dependencies and type-check the calls to it:

```sh
npx holon types check
```

```ts
import { ToolCallError, apps, createApps, type Inputs, type Outputs, type Resources } from "holon-sh";
```

| Export | What it is |
|---|---|
| `apps` | One client per dependency (`apps.bar`), bound through `<ALIAS>_MCP_URL`. |
| `createApps(bindings, options?)` | Clients bound explicitly, for only the dependencies you pass. |
| `ToolCallError` | Thrown by `tools.<tool>` when a tool reports an error or asks for more input. |
| `Inputs["dep"]["tool"]`, `Outputs["dep"]["tool"]` | A tool's argument and structured result types. |
| `Resources["dep"]["uri"]` | The value type of a typed JSON resource. |

<details open>
<summary><h3>Call a tool</h3></summary>

```ts
import { apps } from "holon-sh";

export async function greet(name: string): Promise<string> {
  const greeting = await apps.bar.tools.greet({ name }, { timeout: 5000 });
  return greeting.result;
}
```

Arguments are validated before sending; the result is validated against the output schema and returned. Options are MCP request options: `timeout` in milliseconds, `signal` an `AbortSignal`.

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

Invalid arguments, a result that does not match the schema, and transport failures reject with an ordinary `Error`.

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

A dependency the CLI could not obtain a contract for gets an untyped client: `callTool` accepts any tool name, and `tools` is empty.

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

## Bind a dependency

By default a client reads its endpoint from an environment variable named after the dependency, upper-cased, with `-` as `_`. Each call through it opens and closes its own session.

```sh
BAR_MCP_URL=http://127.0.0.1:3001/mcp node main.ts
```

For authentication, bind explicitly:

```ts
import { createApps } from "holon-sh";

const apps = createApps({
  bar: {
    endpoint: "https://bar.example.com/mcp",
    authProvider: { token: async () => process.env.BAR_TOKEN },
  },
});

await apps.bar.close(); // an explicit binding keeps one session open
```

A binding takes `endpoint`, and optionally `authProvider` (a bearer-token provider or an MCP OAuth client provider), `fetch`, and `scoped: true` to close the session after every call.

## Serve an MCP App view

```ts
import { appView } from "holon-sh/view";

server.registerResource(
  ...appView("Foo", "ui://foo/index.html", new URL("./dist/index.html", import.meta.url), {
    csp: { connectDomains: ["https://bar.example.com"] },
  }),
);
```

The file is read once, when `appView` is called. The page itself uses [`holon-ui`](https://github.com/holon-sh/sdk-ui).

## Other entry points

| Import | Exports |
|---|---|
| `holon-sh/runtime` | What the generated module calls: `createApps(identity, contracts, bindings?, options?)`, `bindApps`, `ToolCallError`, and `setDefaultBinding` for hosts that bind every app at startup. Apps use the generated module instead. |
| `holon-sh/protocol` | Types only: `ToolClient`, `ToolResult`, `CallOptions`, `CallMetadata`, `AuthProvider`, `ToolCallError`. |

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

A provider types a JSON resource by registering it with `mimeType: "application/json"` and an `"sh.holon/outputSchema"` JSON Schema in its `_meta`, as the `orders` server in `tests/fixtures` does. A tool's `"sh.holon/changes"` `_meta` lists the resource URIs a successful call invalidates; [`register`](#function-apps) sets it from `changes`. The client then offers `read` and `watch`:

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

`holon-sh/app` declares typed functions as MCP tools and JSON resources, and `register` adds them to an `McpServer` you construct. Run `holon types generate` first: the CLI extracts input and output schemas from the function types without importing the module. Importing `holon-sh/app` loads that contract once and fails at startup when it is missing; `register` fails when the declarations differ from it. `@modelcontextprotocol/server` is a peer dependency.

```ts
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { register, resource, tool } from "holon-sh/app";
import { appView } from "holon-sh/view";

let count = 0;
const state = resource("counter://state", () => ({ count }));
const show = tool(
  { annotations: { readOnlyHint: true }, _meta: { ui: { resourceUri: "ui://counter/index.html" } } },
  () => ({ count }),
);
const add = tool({ changes: [state] }, ({ amount }: { amount: number }) => {
  count += amount;
  return { count };
});
const view = appView("Counter", "ui://counter/index.html", new URL("./dist/index.html", import.meta.url));

const handler = createMcpHandler(() => {
  const server = new McpServer(
    { name: "example.com/counter", version: "1.0.0" },
    { capabilities: { resources: { subscribe: true } } },
  );
  register(server, { tools: { show, add }, resources: { state } }, uri => handler.notify.resourceUpdated(uri));
  server.registerResource(...view);
  return server;
});
export default handler;
```

The second callback argument is the native MCP `ServerContext`. After a successful call, `register` passes each `changes` URI to its third argument; `createMcpHandler` builds a server per request, so pass `handler.notify.resourceUpdated` for `changes` to reach subscribers. `changes` is a refresh declaration, not authorization or a transaction. A tool opens an MCP App with native `_meta.ui.resourceUri`.

Function inference supports JSON object arguments and results, including nested objects, arrays, optional properties and unions. Unsupported types fail extraction; register those tools with the native MCP APIs.

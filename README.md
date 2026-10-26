# holon-sh

[![CI](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/holon-sh/sdk-ts/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/en/download)
[![MIT License](https://img.shields.io/badge/license-MIT-green)](https://github.com/holon-sh/sdk-ts/blob/main/LICENSE)

`holon-sh` is the Node.js runtime for the typed MCP clients that the [`holon` CLI](https://github.com/holon-sh/cli) generates: it connects over Streamable HTTP, validates arguments and results against each tool's JSON Schema, and throws on tool errors.

The CLI writes the typed module into this package's slot, `node_modules/holon-sh/generated/`, so `import { apps } from "holon-sh"` resolves to your project's own types, and runs tsc over your calls. The runtime never type-checks by itself.

## Install

```sh
npm install holon-sh@dev
```

Node.js 22 or newer. Each app needs its own copy: the CLI refuses to write two apps' clients into one hoisted `holon-sh`. Until the CLI runs, the package exports an empty placeholder client. Do not edit `node_modules/holon-sh/generated/`: the CLI rewrites it on every run.

Then install the CLI:

```sh
curl -fsSL https://holon-labs.dev/install.sh | sh
```

## Example

Declare dependencies under `sh.holon.requires` in your project's [`server.json`](https://modelcontextprotocol.io/registry/quickstart#step-4-create-server-json) ([publisher-provided metadata](https://modelcontextprotocol.io/registry/faq#can-i-add-custom-metadata-when-publishing)). This example uses the public [Context7](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.upstash%2Fcontext7/versions/4.4.4) server.

```json
{
  "name": "com.example/foo",
  "version": "0.1.0",
  "description": "Example Foo",
  "_meta": {
    "io.modelcontextprotocol.registry/publisher-provided": {
      "sh.holon": {
        "requires": {
          "context7": { "name": "io.github.upstash/context7", "version": "4.4.4" }
        }
      }
    }
  }
}
```

Generate `node_modules/holon-sh/generated/` and type-check the calls to it. If `holon-sh` is not installed yet, the CLI runs `npm install` first.

```sh
holon types check
```

Or name the servers yourself. Any `-s` replaces the whole `requires` list, so `server.json` is not needed.

```sh
holon types check -s https://mcp.context7.com/mcp
```

Call the server. A wrong tool name or argument is a type error.

```ts
import { apps } from "holon-sh";

await apps.context7.tools["resolve-library-id"]({ libraryName: "Next.js", query: "app router" });

await apps.context7.tools["resolve-library-id"]({ libraryName: 1, query: "app router" });
// error TS2322: Type 'number' is not assignable to type 'string'.

await apps.context7.tools["resolve-library-id"]({ libraryName: "Next.js" });
// error TS2345: Argument of type '{ libraryName: string; }' is not assignable to parameter of type '{ [key: string]: unknown; libraryName: string; query: string; }'.
//   Property '"query"' is missing in type '{ libraryName: string; }' but required in type '{ [key: string]: unknown; libraryName: string; query: string; }'.

await apps.context7.tools["resolve-library"]({ libraryName: "Next.js", query: "app router" });
// error TS2551: Property 'resolve-library' does not exist on type '{ readonly "query-docs": (input: { [key: string]: unknown; language?: string | undefined; libraryId: string; query: string; }, options?: CallOptions | undefined) => Promise<unknown>; readonly "resolve-library-id": (input: { ...; }, options?: CallOptions | undefined) => Promise<...>; }'. Did you mean 'resolve-library-id'?
```

Context7 publishes no output schema, so its results are `unknown`.

### Development Servers

Let's say you have a server that you're still developing, and it's not in any [MCP Registry](https://modelcontextprotocol.io/registry/about) yet.

```python
# bar/server.py
from mcp.server import MCPServer

server = MCPServer("bar")


@server.tool()
def greet(name: str) -> str:
    return f"hello {name}"
```

Give it a `server.json` beside the entry file.

```json
{
  "name": "com.example/bar",
  "version": "0.1.0",
  "description": "Example Bar"
}
```

Pass the entry file with `-s`. A path inside the project directory is the project's own server, so run from the parent directory and name the project.

```sh
holon types check foo -s bar/server.py
```

```ts
import { apps } from "holon-sh";

const greeting = await apps.bar.tools.greet({ name: "world" });
greeting.result;

await apps.bar.tools.greet({ name: 1 });
// error TS2322: Type 'number' is not assignable to type 'string'.

await apps.bar.tools.hello({ name: "world" });
// error TS2339: Property 'hello' does not exist on type '{ readonly greet: (input: { [key: string]: unknown; name: string; }, options?: CallOptions | undefined) => Promise<{ [key: string]: unknown; result: string; }>; }'.

const text: string = greeting.text;
// error TS2322: Type 'unknown' is not assignable to type 'string'.
```

## Dependencies

A dependency is an MCP server your project calls. For each one `holon` obtains a contract—the JSON Schemas of the server's tools and resources—and writes a typed client `apps.<alias>` into `node_modules/holon-sh/generated/`. The alias is the key in `requires`, or `alias=` before a `-s` value; it defaults to the last segment of the server's name.

A dependency is written in one of three ways.

<details open>
<summary><h3>Source code</h3></summary>

An implementation of an MCP server, or its parent directory, with a `server.json` beside the entry file. The server is read, not started.

```sh
holon types check -s bar/server.py
```

</details>

<details open>
<summary><h3>Registry</h3></summary>

A `sh.holon.requires` entry in [`server.json`](https://modelcontextprotocol.io/registry/quickstart#step-4-create-server-json), or `-s` with a registry version URL. The record is fetched for its contract.

```sh
holon types check -s https://registry.modelcontextprotocol.io/v0.1/servers/io.github.upstash%2Fcontext7/versions/4.4.4
```

</details>

<details open>
<summary><h3>Server</h3></summary>

An endpoint URL. The running server is asked for `tools/list` and `resources/list`.

```sh
holon types check -s https://mcp.context7.com/mcp
```

</details>

## The generated module

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

## Development

This repository is an npm workspace; `packages/node` is the published `holon-sh` package, and this file is copied into it at build time. Node.js 22 or newer.

```sh
npm ci
npm test
npm pack -w packages/node
```

`npm run fixtures` refreshes the committed `tests/fixtures/checkout` slot: it starts the MCP server in `tests/fixtures/orders/server.mjs`, runs `holon types generate --server` for `orders` and `with-hyphen` in a temporary consumer, and copies the generated slot back. Use the `holon` CLI on `PATH`, or set `HOLON=/path/to/holon`. Tests consume the committed fixture and do not invoke the CLI.

`npm run docs:build` builds the [TypeScript reference](https://github.com/holon-sh/sdk-ts/blob/main/packages/node/docs/README.md), which CI uploads as `sdk-reference-typescript` for the website.

## License

MIT

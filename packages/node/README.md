# holon-sh

The Node.js runtime for typed MCP clients. The `holon` CLI (PyPI `holon-types`) reads the MCP servers your server calls and generates typed clients into this package's `generated/` directory, so `import { apps } from "holon-sh"` resolves to your app's own types with no path configuration. At runtime the clients connect over Streamable HTTP, validate arguments and results against each tool's JSON Schema, and throw on tool errors.

For the end-to-end walkthrough (declaring dependencies in `server.json`, generating, checking), see the [`holon-types` README](https://pypi.org/project/holon-types/). This page describes the TypeScript API.

## Install the runtime

Once published, install the dev release (no non-dev version exists yet):

```sh
npm install holon-sh@dev
```

Node.js 22 or newer. Each app needs its own copy: the CLI refuses to write two apps' clients into one hoisted `holon-sh`. Until you run `holon types generate`, the package exports an empty placeholder client.

## Use the generated module

```typescript
import { ToolCallError, apps, createApps, type Inputs, type Outputs, type Resources } from "holon-sh";
```

| Export | What it is |
|---|---|
| `apps` | One client per dependency declared in `server.json`, bound through `<NAME>_MCP_URL`. A named export. |
| `createApps(bindings, options?)` | A client set bound explicitly, containing only the dependencies you pass. |
| `ToolCallError` | Thrown by `tools.<tool>` when a tool reports an error or asks for more input. |
| `Inputs["dep"]["tool"]` | A tool's argument type. |
| `Outputs["dep"]["tool"]` | A tool's structured result type. |
| `Resources["dep"]["uri"]` | The value type of a typed JSON resource. |

Do not edit `node_modules/holon-sh/generated/`; the CLI rewrites it on every run.

### Call a tool

```typescript
import { apps } from "holon-sh";

export async function total(id: string): Promise<number> {
  const order = await apps.orders.tools.lookup({ id }, { timeout: 5000 });
  return order.total;
}
```

`tools.<tool>` validates the arguments against the tool's input schema, sends the request, validates the structured result against the output schema, and returns it. Options are MCP request options: `timeout` is in milliseconds, and `signal` takes an `AbortSignal`.

### Handle tool errors

```typescript
import { ToolCallError, apps } from "holon-sh";

try {
  await apps.orders.tools.lookup({ id });
} catch (error) {
  if (!(error instanceof ToolCallError)) throw error;
  error.app; // "orders"
  error.tool; // "lookup"
  error.code; // "tool_error" | "input_required"
  error.result; // the original MCP result
}
```

Invalid arguments, an output that does not match the schema, and transport or protocol failures reject with an ordinary `Error`.

### Read the whole result

`callTool` returns the full MCP result instead of throwing on tool errors:

```typescript
const result = await apps.orders.callTool({ name: "lookup", arguments: { id } }, { timeout: 5000 });
if (result.resultType === "input_required") {
  // call again with inputResponses and requestState
} else if (result.isError) {
  // application error: inspect result.content
} else {
  result.structuredContent; // typed as Outputs["orders"]["lookup"]
}
```

A dependency the CLI could not obtain a contract for gets an untyped client: `callTool` accepts any tool name and validates nothing, and `tools` is empty.

### Read a resource

A provider can type a JSON resource by registering it with `mimeType: "application/json"` and an `"sh.holon/outputSchema"` JSON Schema in its `_meta`. The client then offers `read` and `watch`:

```typescript
const summary = await apps.orders.resources["orders://summary"].read();

const controller = new AbortController();
await apps.orders.resources["orders://summary"].watch(value => console.log(value.open), {
  signal: controller.signal,
});
```

`watch` needs an endpoint binding and a server that supports resource subscriptions; it calls back with the current value, then on every update, until the signal aborts.

## Bind a dependency

Without an explicit binding, a client reads its endpoint from an environment variable named after the dependency: upper-cased, `-` replaced by `_`, plus `_MCP_URL`. Each call through it opens and closes its own session.

```sh
ORDERS_MCP_URL=http://127.0.0.1:3001/mcp node main.ts
```

To add authentication, bind explicitly with `createApps`:

```typescript
import { createApps } from "holon-sh";

const apps = createApps({
  orders: {
    endpoint: "https://orders.example.com/mcp",
    authProvider: { token: async () => process.env.ORDERS_TOKEN },
  },
});

// An explicit binding keeps one session open; close it on shutdown.
await apps.orders.close();
```

A binding takes `endpoint`, and optionally `authProvider` (a bearer-token provider or an MCP OAuth client provider), `fetch` (a custom fetch implementation), and `scoped: true` (close the session after every call).

## Other entry points

| Import | Exports |
|---|---|
| `holon-sh/view` | `appView(name, uri, file, options?)`, which serves a built HTML file as an MCP App resource; `VIEW_MIME_TYPE`. |
| `holon-sh/runtime` | The runtime the generated module calls: `createApps(identity, contracts, bindings?, options?)`, `bindApps`, `ToolCallError`, and `setDefaultBinding`, which is for hosts that bind every app at startup. Applications use the generated module instead. |
| `holon-sh/protocol` | Types only: `ToolClient`, `ToolResult`, `CallOptions`, `CallMetadata`, `AuthProvider`, `ToolCallError`. |

### Serve an MCP App view

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { appView } from "holon-sh/view";

const server = new McpServer({ name: "checkout", version: "1.0.0" });
server.registerResource(
  ...appView("Checkout", "ui://checkout/index.html", new URL("./dist/index.html", import.meta.url), {
    csp: { connectDomains: ["https://orders.example.com"] },
  }),
);
```

The file is read once, when `appView` is called.

## Regenerate on install

`holon-sh` has a `postinstall` script. When the directory you run `npm install` in has a `server.json` and `holon` is on `PATH`, it runs `holon types generate --no-install --quiet` there. It never fails the install. Set `HOLON_SKIP_POSTINSTALL=1` to turn it off.

npm 11.19 and newer do not run dependency install scripts until you approve them:

```sh
npm install-scripts approve holon-sh
```

The postinstall generates for that one directory, so dependencies on local sibling servers are looked up in the MCP registry. In a monorepo, rerun `holon types generate` with every directory after installing, or set `HOLON_SKIP_POSTINSTALL=1`.

## Type-check against contracts

`holon types check` regenerates the client in a temporary copy of your app and runs `tsc` on it: the app's own `typescript` if installed, otherwise a bundled compiler. A `tsconfig.json` in the app is used when present.

## License

MIT

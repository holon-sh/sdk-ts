# holon-sh

The Node.js runtime for typed MCP clients. The [`holon` CLI](https://github.com/holon-sh/cli) reads the MCP servers your server calls and generates typed clients into this package's `generated/` directory, so `import { apps } from "holon-sh"` resolves to your app's own types with no path configuration. At runtime the clients connect over Streamable HTTP, validate arguments and results against each tool's JSON Schema, and throw on tool errors.

Start with the [CLI README](https://github.com/holon-sh/cli) for the walkthrough. This page is the TypeScript API.

## Install

```sh
npm install holon-sh@dev
```

Node.js 22 or newer. Each app needs its own copy: the CLI refuses to write two apps' clients into one hoisted `holon-sh`. Until you run `holon types generate`, the package exports an empty placeholder client. Do not edit `node_modules/holon-sh/generated/`; the CLI rewrites it on every run.

## The generated module

```typescript
import { ToolCallError, apps, createApps, type Inputs, type Outputs, type Resources } from "holon-sh";
```

| Export | What it is |
|---|---|
| `apps` | One client per dependency in `server.json`, bound through `<NAME>_MCP_URL`. A named export. |
| `createApps(bindings, options?)` | Clients bound explicitly, for only the dependencies you pass. |
| `ToolCallError` | Thrown by `tools.<tool>` when a tool reports an error or asks for more input. |
| `Inputs["dep"]["tool"]`, `Outputs["dep"]["tool"]` | A tool's argument and structured result types. |
| `Resources["dep"]["uri"]` | The value type of a typed JSON resource. |

### Call a tool

```typescript
import { apps } from "holon-sh";

export async function total(id: string): Promise<number> {
  const order = await apps.orders.tools.lookup({ id }, { timeout: 5000 });
  return order.total;
}
```

Arguments are validated before sending; the result is validated against the output schema and returned. Options are MCP request options: `timeout` in milliseconds, `signal` an `AbortSignal`.

### Handle errors

```typescript
import { ToolCallError, apps } from "holon-sh";

try {
  await apps.orders.tools.lookup({ id });
} catch (error) {
  if (!(error instanceof ToolCallError)) throw error;
  error.code;   // "tool_error" | "input_required"
  error.result; // the original MCP result
}
```

Invalid arguments, a result that does not match the schema, and transport failures reject with an ordinary `Error`.

### Read the whole result

`callTool` returns the full MCP result instead of throwing:

```typescript
const result = await apps.orders.callTool({ name: "lookup", arguments: { id } });
if (result.resultType === "input_required") {
  // call again with inputResponses and requestState
} else if (result.isError) {
  // inspect result.content
} else {
  result.structuredContent; // typed as Outputs["orders"]["lookup"]
}
```

A dependency the CLI could not obtain a contract for gets an untyped client: `callTool` accepts any tool name, and `tools` is empty.

### Read a resource

A provider types a JSON resource by registering it with `mimeType: "application/json"` and an `"sh.holon/outputSchema"` JSON Schema in its `_meta`. The client then offers `read` and `watch`:

```typescript
const summary = await apps.orders.resources["orders://summary"].read();

const controller = new AbortController();
await apps.orders.resources["orders://summary"].watch(value => console.log(value.open), {
  signal: controller.signal,
});
```

`watch` calls back with the current value, then on every update, until the signal aborts. It needs an endpoint binding and a server that supports resource subscriptions.

## Bind a dependency

By default a client reads its endpoint from an environment variable named after the dependency, upper-cased, with `-` as `_`. Each call through it opens and closes its own session.

```sh
ORDERS_MCP_URL=http://127.0.0.1:3001/mcp node main.ts
```

For authentication, bind explicitly:

```typescript
import { createApps } from "holon-sh";

const apps = createApps({
  orders: {
    endpoint: "https://orders.example.com/mcp",
    authProvider: { token: async () => process.env.ORDERS_TOKEN },
  },
});

await apps.orders.close(); // an explicit binding keeps one session open
```

A binding takes `endpoint`, and optionally `authProvider` (a bearer-token provider or an MCP OAuth client provider), `fetch`, and `scoped: true` to close the session after every call.

## Serve an MCP App view

```typescript
import { appView } from "holon-sh/view";

server.registerResource(
  ...appView("Checkout", "ui://checkout/index.html", new URL("./dist/index.html", import.meta.url), {
    csp: { connectDomains: ["https://orders.example.com"] },
  }),
);
```

The file is read once, when `appView` is called. The page itself uses [`holon-ui`](https://github.com/holon-sh/sdk-ui).

## Other entry points

| Import | Exports |
|---|---|
| `holon-sh/runtime` | What the generated module calls: `createApps(identity, contracts, bindings?, options?)`, `bindApps`, `ToolCallError`, and `setDefaultBinding` for hosts that bind every app at startup. Apps use the generated module instead. |
| `holon-sh/protocol` | Types only: `ToolClient`, `ToolResult`, `CallOptions`, `CallMetadata`, `AuthProvider`, `ToolCallError`. |

## License

MIT

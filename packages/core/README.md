# holon-core

The transport-agnostic typed MCP client core shared by [`holon-sh`](https://github.com/holon-sh/sdk-ts/tree/main/packages/node) (Node.js) and [`holon-ui`](https://github.com/holon-sh/sdk-ui) (browser).

You do not install this package directly. `holon-sh` and `holon-ui` depend on it, and applications import from them. See the [`holon` CLI](https://github.com/holon-sh/cli) for how clients are generated.

## What it provides

The core turns a contract (the JSON Schemas of a dependency's tools and typed resources) into a client that validates arguments before each call and results after it, and connects to endpoint bindings over Streamable HTTP. It reads no environment variables and has no browser-only code; the runtimes add those through two hooks.

| Export | What it is |
|---|---|
| `createApps(identity, contracts, bindings?, options?)` | One client per contract and declared dependency. Without `bindings`, each call asks `options.resolve` for a binding. |
| `bindApps(identity, contracts, bindings, options?)` | Only the dependencies in `bindings`; unknown names throw. |
| `ToolCallError` | Thrown by `tools.<tool>` for `tool_error` and `input_required` results. |
| `CreateOptions` | `validator` (JSON Schema validator factory; the default uses Ajv), `resolve(app)` (binding for an unbound app, consulted on every call), `session(app, binding)` (a `ToolSession` for a binding the core does not connect to itself). |
| `Binding`, `EndpointBinding` | `endpoint`, plus optional `authProvider`, `fetch`, `scoped`. |
| `ToolSession` | The subset of an MCP client a `session` hook returns: `callTool`, `readResource`, `listTools`. |
| `Identity`, `Contract`, `RuntimeClient` | The generated module's inputs and the untyped client type. |

`holon-core/protocol` exports the client types the generated modules use: `ToolClient`, `ToolResult`, `CallOptions`, `CallMetadata`, `AuthProvider`, `ToolCallError`.

## License

MIT

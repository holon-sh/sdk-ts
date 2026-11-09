# TypeScript SDK

The `holon-sh` package provides typed MCP clients and server-side HTML views for Node.js 22 or later.

| Import | Purpose |
| --- | --- |
| `holon-sh/runtime` | Low-level client construction and binding resolution |
| `holon-sh/view` | Server registration of built HTML views |
| `holon-sh/protocol` | Shared client/result types and `ToolCallError` |

Generated clients live in your project, in `generated/holon-sh/` beside its
`package.json`. They export `apps`, `createApps`, `ToolCallError` and the
`Apps`, `Inputs`, `Outputs`, `InputTypes`, `OutputTypes` and `Resources` types,
and import `holon-sh/runtime`, so install `holon-sh` in the project.

Run `holon types generate` from your project directory to use its `server.json`
dependencies, or pass explicit dependencies with
`holon types generate --server orders=https://orders.example.com/mcp`.
Then run `holon types check --no-generate` to check calls against the generated types.

Generated clients accept endpoint bindings. Hosts such as `holon-ui` can use the
low-level runtime's `CreateOptions.session` hook to serve custom bindings.
Use `appView` to register built HTML with a Node MCP server.

See [generate clients](https://holon-labs.dev/docs/#generate-clients),
[bind and authenticate clients](https://holon-labs.dev/docs/#bind-sdk-clients),
and [handle tool results](https://holon-labs.dev/docs/#handle-tool-results).

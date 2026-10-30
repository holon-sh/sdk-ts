# TypeScript SDK

The `holon-sh` package provides typed MCP clients and server-side HTML views for Node.js 22 or later.

| Import | Purpose |
| --- | --- |
| `holon-sh` | Generated `apps`, `createApps`, and project types |
| `holon-sh/runtime` | Low-level client construction and binding resolution |
| `holon-sh/view` | Server registration of built HTML views |
| `holon-sh/app` | Typed functions, JSON resources, and compiled app views |
| `holon-sh/protocol` | Shared client/result types; types only |

The root exports named values: `import { apps, createApps } from "holon-sh"`.
Client generation fills the package slot with your project's `Apps`, `Inputs`,
`Outputs`, and `Resources` types. The initial placeholder uses `Record<never, never>`.

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

# TypeScript SDK

The `holon-sh` package provides typed MCP clients, browser helpers, and server-side HTML views. Server entrypoints require Node 22 or later.

| Import                     | Environment | Purpose                                                                |
| -------------------------- | ----------- | ---------------------------------------------------------------------- |
| `holon-sh`                 | Node        | Generated `apps`, `createApps`, and project types                      |
| `holon-sh/browser`         | Browser     | Generated `createApps` with explicit endpoint or MCP App host bindings |
| `holon-sh/runtime`         | Node        | Low-level client construction and binding resolution                   |
| `holon-sh/browser-runtime` | Browser     | Browser-compatible runtime and WebMCP helpers                          |
| `holon-sh/view`            | Node        | Server registration of built HTML views                                |
| `holon-sh/protocol`        | Types only  | Shared client/result types                                             |

The root's `apps` value is a **default export**: `import apps from "holon-sh"`.
The factory is named: `import { createApps } from "holon-sh"`. In browsers use
`import { createApps } from "holon-sh/browser"` and provide explicit bindings.

Client generation fills the root and browser slots with your project's `Apps`, `Inputs`, `Outputs`, and `Resources` types. Their initial declarations use `Record<never, never>`.

These are standalone SDK APIs. Platform tutorials use a separately pinned platform runtime until its SDK migration passes tutorial verification.

Run `holon types generate`, then `holon check --no-published`, from your manifest directory using the standalone CLI. Its development preview targets the former `@holon-sh/apps` slot; generation for this package requires the CLI package-name migration. See the generation guide for setup.

See [generate clients](https://holon-labs.dev/docs/#generate-clients), [bind and authenticate clients](https://holon-labs.dev/docs/#bind-sdk-clients), [handle tool results](https://holon-labs.dev/docs/#handle-tool-results), and [use browser clients and views](https://holon-labs.dev/docs/#use-browser-clients-and-views).

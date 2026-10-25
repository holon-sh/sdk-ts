# TypeScript SDK

The `holon-sh` package provides typed MCP clients, browser helpers, and server-side HTML views. Server entrypoints require Node 22 or later.

| Import                     | Environment | Purpose                                                                                   |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `holon-sh`                 | Node        | Generated `apps`, `createApps`, and project types                                         |
| `holon-sh/browser`         | Browser     | Generated `createApps` with explicit endpoint or MCP App host bindings; no default `apps` |
| `holon-sh/runtime`         | Node        | Low-level client construction and binding resolution                                      |
| `holon-sh/browser-runtime` | Browser     | Browser-compatible runtime and WebMCP helpers                                             |
| `holon-sh/view`            | Node        | Server registration of built HTML views                                                   |
| `holon-sh/protocol`        | Types only  | Shared client/result types; no JavaScript runtime export                                  |

The root's `apps` value is a **default export**: `import apps from "holon-sh"`.
The factory is named: `import { createApps } from "holon-sh"`. In browsers use
`import { createApps } from "holon-sh/browser"` and provide explicit bindings.

The root and browser declarations below are the package's **empty generation slots**. `Record<never, never>` means the package has not been specialized for a consuming project. Client generation replaces these with project-specific `Apps`, `Inputs`, `Outputs`, and `Resources`. This reference intentionally excludes application-specific tool catalogs.

These are standalone SDK APIs. Platform tutorials use a separately pinned platform runtime until its SDK migration passes tutorial verification.

Client generation uses the separate standalone CLI: `holon types generate`, followed by `holon check --no-published`, from the directory containing the project manifest. Installing the SDK does not install that executable. The CLI is currently a development preview, and its inspected build still targets the former `@holon-sh/apps` slot; generation for this package requires the CLI's package-name migration. The generation guide below covers installation, command selection, and this compatibility prerequisite.

See [generate clients](https://holon-labs.dev/docs/#generate-clients), [bind and authenticate clients](https://holon-labs.dev/docs/#bind-sdk-clients), [handle tool results](https://holon-labs.dev/docs/#handle-tool-results), and [use browser clients and views](https://holon-labs.dev/docs/#use-browser-clients-and-views).

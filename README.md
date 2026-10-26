# Holon TypeScript SDK

Runtime packages for typed MCP clients in TypeScript and JavaScript. The [`holon` CLI](https://github.com/holon-sh/cli) reads the MCP servers your server calls and generates a typed client into the installed runtime package; these packages are what that client runs on.

| Package | Install it? | What it is |
|---|---|---|
| [`holon-sh`](packages/node) | Yes, in every Node.js MCP server that calls other servers | The Node.js runtime. `import { apps } from "holon-sh"` gives you the generated, typed clients. Also ships `appView` for serving MCP App views. |
| [`holon-core`](packages/core) | No | The transport-agnostic client core shared by `holon-sh` and `holon-ui`. Installed as their dependency. |

Browser code (MCP App views, WebMCP) uses [`holon-ui`](https://github.com/holon-sh/sdk-ui) instead of `holon-sh`.

## Develop

This repository is an npm workspace. Node.js 22 or newer.

```sh
HOLON_SKIP_POSTINSTALL=1 npm ci
npm test
npm pack -w packages/core -w packages/node
```

`npm run fixtures` regenerates `tests/fixtures` with the `holon` CLI on `PATH`.

## License

MIT

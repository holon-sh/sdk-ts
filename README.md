# Holon TypeScript SDK

The Node.js runtime for typed MCP clients in TypeScript and JavaScript. The [`holon` CLI](https://github.com/holon-sh/cli) reads the MCP servers your server calls and generates a typed client into the installed runtime package; the client runs on `holon-sh`.

Install [`holon-sh`](packages/node) in every Node.js MCP server that calls other servers. It contains the transport, schema validator, and view-resource helper in one package. `import { apps } from "holon-sh"` gives you the generated, typed clients.

## Develop

This repository is an npm workspace. Node.js 22 or newer.

```sh
npm ci
npm test
npm pack -w packages/node
```

`npm run fixtures` is the only way to refresh the committed `tests/fixtures/checkout` slot. It starts the literal MCP server in `tests/fixtures/orders/server.mjs`, runs the public `holon types generate` command with `--server` for `orders` and `with-hyphen` in a temporary consumer, and copies the generated slot back. It needs no package install or external network. Use the `holon` CLI on `PATH`, or set `HOLON=/path/to/holon`.

After `npm ci`, run `npm_config_offline=true npm test` to check the packages without registry access. Tests consume the committed fixture and do not invoke the CLI.

`npm run docs:build` builds the [TypeScript reference](packages/node/docs/README.md).
CI uploads its `sdk-reference-typescript` bundle for the website.

## License

MIT

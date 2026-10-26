# Building the TypeScript reference

From the repository root:

```sh
npm ci
npm run docs:build
```

TypeDoc and typedoc-plugin-markdown read the runtime and protocol declarations,
view helper, and actual package generation slot. Write API comments in
`packages/node/runtime.d.ts`, `packages/node/protocol.d.ts`, and
`packages/node/src/view.ts`. The slot comes from the normal package build.
`public-api.json` lists the supported exports of every package entrypoint.
The build rejects coverage drift, generator warnings, and unresolved links.

The reference describes generated-client conventions and the commented source API.

`packages/node/docs/_build/bundle/` contains Markdown pages and symbol routes in `reference.json`
and checksums/provenance in `manifest.json`. CI uploads `sdk-reference-typescript`
for the website to import and render.

The artifact retains schema version 1, the `holon-sh` package identity, and
`sdk/typescript/` page and symbol routes. Source links point into `packages/node`.
Only the current Node package entrypoints are included.

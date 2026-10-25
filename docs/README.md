# Building the TypeScript reference

```sh
npm ci
npm run docs:build
```

TypeDoc and typedoc-plugin-markdown read the runtime declarations, protocol
source, view helper, and actual package generation slots. Write API comments in
`src/`. The slots come from the normal package build.
`public-api.json` lists the supported exports of every package entrypoint.
The build rejects coverage drift, generator warnings, and unresolved links.

The reference describes generated-client conventions and the commented source API.

`docs/_build/bundle/` contains Markdown pages and symbol routes in `reference.json`
and checksums/provenance in `manifest.json`. CI uploads `sdk-reference-typescript`
for the website to import and render.

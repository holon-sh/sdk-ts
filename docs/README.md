# Building the TypeScript reference

```sh
npm ci
npm run docs:build
```

TypeDoc and typedoc-plugin-markdown read the runtime declarations, protocol
source, view helper, and actual package generation slots. Write API comments in
`src/`; the slots are read from the normal package build, not handwritten copies.
`public-api.json` lists the supported exports of every package entrypoint.
The build rejects coverage drift, generator warnings, and unresolved links.

The generated slots are documented as generic conventions. No consuming
application's contract or tool catalog is included. Flattened protocol helper
types are implementation details; the reference uses their commented source API.

`docs/_build/bundle/` contains Markdown pages and symbol routes in `reference.json`
and checksums/provenance in `manifest.json`. CI uploads `sdk-reference-typescript`
for import into the existing website. The reference has no separate theme or site.

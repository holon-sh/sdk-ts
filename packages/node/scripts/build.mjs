import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "src");

// view.ts imports only node:fs/promises, so tsc emits both the module and its declarations.
const view = ts.createProgram([join(src, "view.ts"), join(src, "app.ts")], {
  strict: true,
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  skipLibCheck: true,
  declaration: true,
  rootDir: src,
  outDir: root,
});
const diagnostics = ts.getPreEmitDiagnostics(view);
if (diagnostics.length)
  throw new Error(
    ts.formatDiagnostics(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (p) => p,
      getNewLine: () => "\n",
    }),
  );
const emitted = view.emit();
if (emitted.emitSkipped) throw new Error("view.ts was not emitted.");

// The repository README is the package README.
copyFileSync(join(root, "..", "..", "README.md"), join(root, "README.md"));

// npm tarballs always start with an empty slot; generation belongs to the consumer.
const generated = join(root, "generated");
rmSync(generated, { recursive: true, force: true });
mkdirSync(generated);
const banner = "// holon-generated-apps-v1 placeholder\n";
const emptyTypes =
  'export type Apps = Record<never, never>;\nexport type Inputs = Record<never, never>;\nexport type Outputs = Record<never, never>;\nexport type InputTypes = Inputs;\nexport type OutputTypes = Outputs;\nexport type Resources = Record<never, never>;\nexport { ToolCallError } from "../protocol.js";\nexport type { Binding, EndpointBinding, CreateOptions } from "../runtime.js";\nimport type { CreateOptions } from "../runtime.js";\nexport declare function createApps(bindings: Record<string, never>, options?: CreateOptions): Apps;\n';
writeFileSync(
  join(generated, "index.js"),
  banner +
    'import {createApps as create} from "../runtime.mjs";\nexport {ToolCallError} from "../runtime.mjs";\nexport const apps = create({name:"unconfigured",version:"0",requires:{}}, {});\nexport function createApps(bindings, options) { if (Object.keys(bindings).length) throw new Error("Run holon types generate to configure app bindings."); return apps; }\n',
);
writeFileSync(
  join(generated, "index.d.ts"),
  banner + emptyTypes + "export declare const apps: Apps;\n",
);
writeFileSync(
  join(generated, "holon-generated.json"),
  JSON.stringify(
    { marker: "holon-generated-apps-v1", placeholder: true },
    null,
    2,
  ) + "\n",
);

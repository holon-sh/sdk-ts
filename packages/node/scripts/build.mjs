import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "src");

// view.ts imports only node:fs/promises, so tsc emits both the module and its declarations.
const view = ts.createProgram([join(src, "view.ts")], { strict: true, target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, skipLibCheck: true, declaration: true, rootDir: src, outDir: root });
const diagnostics = ts.getPreEmitDiagnostics(view);
if (diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: p => p, getNewLine: () => "\n" }));
const emitted = view.emit();
if (emitted.emitSkipped) throw new Error("view.ts was not emitted.");

// The repository README is the package README.
copyFileSync(join(root, "..", "..", "README.md"), join(root, "README.md"));


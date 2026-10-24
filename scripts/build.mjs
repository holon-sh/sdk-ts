import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { zipSync } from "fflate";
import ts from "typescript";
import { protocolDeclarations } from "../src/runtime/protocol.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
mkdirSync(join(root, "extract"), { recursive: true });
const source = name => join(root, "src", name);
const nodeBanner = 'import { createRequire as _createRequire } from "node:module"; import { fileURLToPath as _fileURLToPath } from "node:url"; import { dirname as _dirname } from "node:path"; const require = _createRequire(import.meta.url); const __filename = _fileURLToPath(import.meta.url); const __dirname = _dirname(__filename);';
const bundle = options => build({ bundle: true, metafile: true, format: "esm", legalComments: "inline", absWorkingDir: root, ...options });
const builds = [];
builds.push(await bundle({ entryPoints: [source("extract/runner.mjs")], outfile: join(dist, "runner.mjs"), platform: "node", target: "node22", banner: { js: nodeBanner } }));
builds.push(await bundle({ entryPoints: [source("extract/extract.mjs")], outfile: join(root, "extract/extract.mjs"), platform: "node", target: "node22", banner: { js: nodeBanner } }));
builds.push(await bundle({ entryPoints: [source("runtime/runtime.mjs")], outfile: join(root, "runtime.mjs"), platform: "node", target: "node22" }));
const separateValidator = { name: "browser-validate", setup: build => build.onResolve({ filter: /^\.\/validate\.mjs$/ }, () => ({ path: "./browser-validate.mjs", external: true })) };
builds.push(await bundle({ entryPoints: [source("runtime/runtime.mjs")], outfile: join(root, "browser-runtime.mjs"), platform: "browser", target: "es2022", plugins: [separateValidator] }));
builds.push(await bundle({ entryPoints: [source("runtime/validate.mjs")], outfile: join(root, "browser-validate.mjs"), platform: "browser", target: "es2022" }));
builds.push(await bundle({ entryPoints: [source("view.ts")], outfile: join(root, "view.js"), platform: "node", target: "node22" }));
const view = ts.createProgram([source("view.ts")], { strict: true, target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, skipLibCheck: true, declaration: true, emitDeclarationOnly: true, outDir: root });
const diagnostics = ts.getPreEmitDiagnostics(view);
if (diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: p => p, getNewLine: () => "\n" }));
view.emit();
const printed = ts.createPrinter({ removeComments: true }).printFile(ts.createSourceFile("protocol.d.ts", protocolDeclarations(), ts.ScriptTarget.Latest, true));
if (/\bfrom\s+["']/.test(printed)) throw new Error("Protocol declarations must be self-contained.");
writeFileSync(join(root, "protocol.d.ts"), printed);
for (const name of ["runtime.d.ts", "browser-runtime.d.ts"]) copyFileSync(source("runtime/runtime.d.ts"), join(root, name));
copyFileSync(source("extract/extract.d.ts"), join(root, "extract/extract.d.ts"));

// npm tarballs always start with an empty slot; generation belongs to the consumer.
const generated = join(root, "generated");
rmSync(generated, { recursive: true, force: true });
mkdirSync(generated);
const banner = "// holon-generated-apps-v1 placeholder\n";
const emptyTypes = 'export type Apps = Record<never, never>;\nexport type Inputs = Record<never, never>;\nexport type Outputs = Record<never, never>;\nexport type InputTypes = Inputs;\nexport type OutputTypes = Outputs;\nexport type Resources = Record<never, never>;\nexport { ToolCallError } from "../protocol.js";\nexport type { Binding, EndpointBinding, HostBinding, CreateOptions } from "../runtime.js";\nimport type { CreateOptions } from "../runtime.js";\nexport declare function createApps(bindings: Record<string, never>, options?: CreateOptions): Apps;\n';
writeFileSync(join(generated, "index.js"), banner + 'import {createApps as create} from "../runtime.mjs";\nexport {ToolCallError} from "../runtime.mjs";\nexport const apps = create({name:"unconfigured",version:"0",requires:{}}, {});\nexport function createApps(bindings, options) { if (Object.keys(bindings).length) throw new Error("Run holon types generate to configure app bindings."); return apps; }\n');
writeFileSync(join(generated, "browser.js"), banner + 'import {bindApps} from "../browser-runtime.mjs";\nexport {ToolCallError,exposeTools,registerPageTools} from "../browser-runtime.mjs";\nexport function createApps(bindings, options) { return bindApps({name:"unconfigured",version:"0",requires:{}}, {}, bindings, options); }\n');
writeFileSync(join(generated, "index.d.ts"), banner + emptyTypes + 'export declare const apps: Apps;\n');
writeFileSync(join(generated, "browser.d.ts"), banner + emptyTypes + 'export { exposeTools, registerPageTools } from "../browser-runtime.js";\n');
writeFileSync(join(generated, "holon-generated.json"), JSON.stringify({ marker: "holon-generated-apps-v1", placeholder: true }, null, 2) + "\n");

const packages = new Set();
for (const { metafile } of builds) for (const path of Object.keys(metafile.inputs)) {
  if (!path.includes("node_modules/")) continue;
  let directory = dirname(join(root, path));
  while (!existsSync(join(directory, "package.json"))) directory = dirname(directory);
  packages.add(directory);
}
const notices = [];
for (const directory of [...packages].sort()) {
  const pkg = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  const licensesIn = directory => readdirSync(directory).filter(f => /^(licen[sc]e|notice)(\.|$)/i.test(f));
  let licenseDirectory = directory;
  let licenses = licensesIn(directory);
  while (!licenses.length && licenseDirectory.includes("node_modules/")) { licenseDirectory = dirname(licenseDirectory); licenses = licensesIn(licenseDirectory); }
  if (!licenses.length) throw new Error(`Missing license notice for ${relative(root, directory)}`);
  notices.push(`${pkg.name ?? relative(root, directory)} ${pkg.version ?? ""}\n${licenses.sort().map(name => readFileSync(join(licenseDirectory, name), "utf8")).join("\n")}`);
}
writeFileSync(join(root, "THIRD-PARTY-NOTICES.txt"), notices.join("\n\n"));
const files = { "runner.mjs": readFileSync(join(dist, "runner.mjs")), "THIRD-PARTY-NOTICES.txt": readFileSync(join(root, "THIRD-PARTY-NOTICES.txt")), "version.json": Buffer.from(JSON.stringify({ version }) + "\n") };
const lib = join(dirname(createRequire(import.meta.url).resolve("typescript/package.json")), "lib");
mkdirSync(join(dist, "lib"));
for (const name of readdirSync(lib)) if (/^lib.*\.d\.ts$/.test(name)) {
  files[`lib/${name}`] = readFileSync(join(lib, name));
  copyFileSync(join(lib, name), join(dist, "lib", name));
}
const archive = `cli-tooling-ts-${version}.zip`;
const bytes = zipSync(Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([name, data]) => [name, [new Uint8Array(data), { mtime: new Date(1980, 0, 1) }]])), { level: 9 });
writeFileSync(join(dist, archive), bytes);
writeFileSync(join(dist, "SHA256SUMS"), `${createHash("sha256").update(bytes).digest("hex")}  ${archive}\n`);

import { Application } from "typedoc";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
execFileSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
const input = "docs/_build/entrypoints";
mkdirSync(input, { recursive: true });
// Read the actual published slot and resolve shared types to the package declarations.
const source = readFileSync("generated/index.d.ts", "utf8").replace(
  /\.\.\/(protocol|runtime)\.js/g,
  (_, module) => `../../../${module}.js`,
);
writeFileSync(`${input}/root.d.ts`, source);
const app = await Application.bootstrapWithPlugins({ options: "typedoc.json" });
const project = await app.convert();
if (!project) throw new Error("TypeDoc conversion failed");
app.validate(project);
if (app.logger.hasErrors() || app.logger.hasWarnings())
  throw new Error("TypeDoc validation failed");
const raw = "docs/_build/markdown";
const urls = new Map();
app.renderer.postMarkdownRenderAsyncJobs.push(async () => {
  for (const module of project.children) {
    urls.set(module, app.renderer.router.getFullUrl(module));
    for (const member of module.children)
      urls.set(member, app.renderer.router.getFullUrl(member));
  }
});
await app.generateOutputs(project);
if (app.logger.hasErrors() || app.logger.hasWarnings())
  throw new Error("TypeDoc rendering failed");
const pkg = JSON.parse(readFileSync("package.json"));
const inventory = JSON.parse(readFileSync("docs/public-api.json"));
const entries = {
  root: ".",
  runtime: "./runtime",
  view: "./view",
  app: "./app",
  protocol: "./protocol",
};
if (
  JSON.stringify(Object.keys(pkg.exports).sort()) !==
  JSON.stringify(Object.keys(inventory).sort())
)
  throw new Error(
    "Package entrypoints changed; update the public API inventory",
  );
const program = ts.createProgram(
  Object.values(pkg.exports).map((e) => e.types),
  {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
  },
);
const checker = program.getTypeChecker();
const sources = new Map([
  [
    "README.md",
    { id: "index", title: "TypeScript SDK", source: "packages/node/package.json" },
  ],
  [
    "modules.md",
    { id: "modules", title: "TypeScript entrypoints", source: "packages/node/package.json" },
  ],
]);
for (const module of project.children) {
  const id = module.name.split("/").at(-1);
  const entry = entries[id];
  if (!entry) throw new Error(`Unknown entrypoint: ${module.name}`);
  const published = checker
    .getExportsOfModule(
      checker.getSymbolAtLocation(
        program.getSourceFile(pkg.exports[entry].types),
      ),
    )
    .filter(
      (s) =>
        entry !== "./protocol" ||
        s.declarations?.some(
          (d) => ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Export,
        ),
    )
    .map((s) => s.name)
    .sort();
  const documented = module.children.map((c) => c.name).sort();
  if (
    JSON.stringify(published) !== JSON.stringify(inventory[entry]) ||
    JSON.stringify(documented) !== JSON.stringify(inventory[entry])
  )
    throw new Error(`Public API coverage changed: ${entry}`);
  sources.set(urls.get(module), {
    id,
    title: `holon-sh${entry === "." ? "" : entry.slice(1)}`,
    source: `packages/node/${id === "root"
      ? "scripts/build.mjs"
      : id === "view" || id === "app" ? `src/${id}.ts` : `${id}.d.ts`}`,
  });
}
const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const pages = [],
  symbols = {},
  targets = new Set();
for (const [file, info] of sources) {
  let pending, fence;
  const counts = new Map(),
    headings = [],
    lines = [];
  for (const line of readFileSync(`${raw}/${file}`, "utf8")
    .replace(/^# .+$/m, `# ${info.title}`)
    .split("\n")) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
        fence = undefined;
    }
    if (marker || fence) {
      lines.push(line);
      continue;
    }
    const anchor = line.match(/^<a id="([^"]+)"><\/a>$/);
    if (anchor) {
      pending = anchor[1];
      continue;
    }
    const heading = line.match(/^#{1,6} (.+)/);
    if (heading) {
      const slug = heading[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const count = counts.get(slug) ?? 0;
      counts.set(slug, count + 1);
      const id = `sdk/typescript/${info.id}/${pending ?? "section-" + slug + (count ? `-${count}` : "")}`;
      if (targets.has(id)) throw new Error(`Duplicate anchor: ${id}`);
      headings.push({ id, title: heading[1] });
      targets.add(id);
      pending = undefined;
    }
    lines.push(line);
  }
  const id = `sdk/typescript/${info.id}`;
  targets.add(id);
  pages.push({
    id,
    title: info.title,
    headings,
    markdown: lines.join("\n"),
    file,
  });
}
const route = (file, fragment) => {
  const info = sources.get(file);
  const target =
    info && `sdk/typescript/${info.id}${fragment ? `/${fragment}` : ""}`;
  if (!target || !targets.has(target))
    throw new Error(`Unresolved reference: ${file}#${fragment}`);
  return target;
};
for (const module of project.children) {
  const name = sources.get(urls.get(module)).title;
  for (const member of module.children) {
    const [file, fragment] = urls.get(member).split("#");
    symbols[`${name}.${member.name}`] = route(file, fragment);
  }
}
for (const page of pages) {
  page.markdown = page.markdown.replace(/\]\(([^)]+)\)/g, (match, href) => {
    if (/^[a-z]+:|^\//i.test(href)) return match;
    const [path, fragment] = href.split("#");
    return `](#${route(path ? posix.normalize(posix.join(posix.dirname(page.file), path)) : page.file, fragment)})`;
  });
  page.markdown += `\n[Source](https://github.com/holon-sh/sdk-ts/blob/${sha}/${sources.get(page.file).source})\n`;
  delete page.file;
}
const out = "docs/_build/bundle";
mkdirSync(out, { recursive: true });
const data = JSON.stringify({ pages, symbols }, null, 2) + "\n";
writeFileSync(`${out}/reference.json`, data);
const manifest = {
  schemaVersion: 1,
  language: "typescript",
  package: pkg.name,
  version: pkg.version,
  source: {
    repository: "holon-sh/sdk-ts",
    sha,
    ref: process.env.GITHUB_REF ?? "local",
    runId: process.env.GITHUB_RUN_ID ?? "",
    runNumber: Number(process.env.GITHUB_RUN_NUMBER ?? 0),
    dirty: !!execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
      encoding: "utf8",
    }).trim(),
  },
  files: { "reference.json": createHash("sha256").update(data).digest("hex") },
};
writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Built ${pages.length} pages, ${Object.keys(symbols).length} symbols: ${out}`,
);

import ts from "typescript";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("./protocol.ts", import.meta.url));

export function protocolDeclarations() {
  const program = ts.createProgram([file], { strict: true, target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, skipLibCheck: true });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, {getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:path=>path,getNewLine:()=>"\n"}));
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  const declarations = [];
  const seen = new Map();
  const serialize = type => {
    if (type.flags & ts.TypeFlags.Any) return "unknown";
    if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Union | ts.TypeFlags.Intersection))) return checker.typeToString(type);
    if (type.symbol?.name === "AbortSignal") return "AbortSignal";
    if (seen.has(type)) return seen.get(type);
    const name = `Protocol${seen.size}`;
    seen.set(type, name);
    let body;
    if (type.isUnion()) body = type.types.map(serialize).join(" | ");
    else if (type.isIntersection()) body = type.types.map(serialize).join(" & ");
    else if (checker.isArrayType(type)) body = `Array<${serialize(checker.getTypeArguments(type)[0])}>`;
    else if (checker.isTupleType(type)) body = `[${checker.getTypeArguments(type).map(serialize).join(", ")}]`;
    else {
      const fields = checker.getPropertiesOfType(type).map(property => `${JSON.stringify(property.name)}${property.flags & ts.SymbolFlags.Optional ? "?" : ""}: ${serialize(checker.getTypeOfSymbolAtLocation(property, source))};`);
      for (const info of checker.getIndexInfosOfType(type)) fields.push(`[key: ${serialize(info.keyType)}]: ${serialize(info.type)};`);
      for (const signature of type.getCallSignatures()) {
        const parameters = signature.parameters.map((parameter, i) => `arg${i}${parameter.flags & ts.SymbolFlags.Optional ? "?" : ""}: ${serialize(checker.getTypeOfSymbolAtLocation(parameter, source))}`);
        fields.push(`(${parameters.join(", ")}): ${serialize(signature.getReturnType())};`);
      }
      body = `{${fields.join("\n")}}`;
    }
    declarations.push(`type ${name} = ${body};`);
    return name;
  };
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    for (const binding of statement.importClause.namedBindings.elements) declarations.push(`type ${binding.name.text} = ${serialize(checker.getTypeAtLocation(binding.name))};`);
  }
  const printer = ts.createPrinter({ removeComments: true });
  for (const statement of source.statements) if (!ts.isImportDeclaration(statement)) declarations.push(printer.printNode(ts.EmitHint.Unspecified, statement, source));
  return declarations.join("\n");
}

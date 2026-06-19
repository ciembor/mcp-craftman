import ts from "typescript";

import type { GeneratedNames } from "./name-style.js";

export function updateRegistrySource(source: string, names: GeneratedNames): string {
  const sourceFile = ts.createSourceFile("registry.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const registryCall = findRegistryCall(sourceFile);

  if (!registryCall) {
    throw new Error("Could not find createCapabilityRegistry([...]) in src/mcp/registry.ts.");
  }

  let updated = source;

  updated = addRegistryElement(updated, sourceFile, registryCall, names.variableName);
  updated = addFeatureImport(updated, sourceFile, names);

  return updated;
}

function addFeatureImport(source: string, sourceFile: ts.SourceFile, names: GeneratedNames): string {
  const modulePath = `../features/${names.featurePath}/index.js`;
  const existingImport = sourceFile.statements.find(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === modulePath,
  );

  if (existingImport) {
    return addNamedImport(source, sourceFile, existingImport, names.variableName);
  }

  const lastImport = [...sourceFile.statements].reverse().find(ts.isImportDeclaration);
  const importText = `import { ${names.variableName} } from "${modulePath}";`;

  if (!lastImport) {
    return `${importText}\n\n${source}`;
  }

  const insertPosition = lastImport.getEnd();
  return `${source.slice(0, insertPosition)}\n${importText}${source.slice(insertPosition)}`;
}

function addNamedImport(
  source: string,
  sourceFile: ts.SourceFile,
  importDeclaration: ts.ImportDeclaration,
  importName: string,
): string {
  const namedImports = getNamedImports(importDeclaration);

  if (!namedImports) {
    throw new Error("Existing feature import must use named imports.");
  }

  if (namedImports.elements.some((element) => element.name.text === importName)) {
    return source;
  }

  const insertPosition = namedImports.elements.length === 0 ? namedImports.getStart(sourceFile) + 1 : namedImports.elements.end;
  const prefix = namedImports.elements.length === 0 ? "" : ", ";

  return `${source.slice(0, insertPosition)}${prefix}${importName}${source.slice(insertPosition)}`;
}

function addRegistryElement(
  source: string,
  sourceFile: ts.SourceFile,
  registryCall: ts.CallExpression,
  variableName: string,
): string {
  const registryItems = registryCall.arguments[0];

  if (!registryItems || !ts.isArrayLiteralExpression(registryItems)) {
    throw new Error("createCapabilityRegistry must receive an array literal.");
  }

  if (registryItems.elements.some((element) => element.getText(sourceFile) === variableName)) {
    return source;
  }

  const insertPosition = registryItems.getEnd() - 1;
  const prefix = registryItems.elements.length === 0 ? "\n" : "";
  let suffix = "";

  if (registryItems.elements.length > 0 && source[insertPosition - 1] !== "\n") {
    suffix = "\n";
  }

  return `${source.slice(0, insertPosition)}${suffix}${prefix}  ${variableName},\n${source.slice(insertPosition)}`;
}

function findRegistryCall(sourceFile: ts.SourceFile): ts.CallExpression | undefined {
  let found: ts.CallExpression | undefined;

  function visit(node: ts.Node): void {
    if (found) {
      return;
    }

    if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === "createCapabilityRegistry") {
      found = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return found;
}

function getNamedImports(importDeclaration: ts.ImportDeclaration): ts.NamedImports | undefined {
  const namedBindings = importDeclaration.importClause?.namedBindings;

  return namedBindings && ts.isNamedImports(namedBindings) ? namedBindings : undefined;
}

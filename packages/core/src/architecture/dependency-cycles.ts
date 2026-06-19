import { formatErrorList } from "../registry/registry-validation.js";
import { extractImports, normalizePath, resolveRelativePathWithoutExtension, type SourceFile } from "./source-files.js";

export function assertNoDependencyCycles(files: readonly SourceFile[]): void {
  const errors = validateNoDependencyCycles(files);

  if (errors.length > 0) {
    throw new Error(`Dependency cycles detected:\n${formatErrorList(errors)}`);
  }
}

function validateNoDependencyCycles(files: readonly SourceFile[]): string[] {
  const graph = createImportGraph(files);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const errors: string[] = [];

  for (const file of graph.keys()) {
    visitFile(file, graph, visiting, visited, [], errors);
  }

  return errors;
}

function createImportGraph(files: readonly SourceFile[]): Map<string, readonly string[]> {
  const knownPaths = new Set(files.map((file) => normalizePath(file.path)));
  const graph = new Map<string, readonly string[]>();

  for (const file of files) {
    const filePath = normalizePath(file.path);
    const imports = extractImports(file.content)
      .filter((importPath) => importPath.startsWith("."))
      .map((importPath) => resolveRelativeImport(filePath, importPath, knownPaths))
      .filter((importPath): importPath is string => Boolean(importPath));

    graph.set(filePath, imports);
  }

  return graph;
}

function visitFile(
  file: string,
  graph: Map<string, readonly string[]>,
  visiting: Set<string>,
  visited: Set<string>,
  stack: readonly string[],
  errors: string[],
): void {
  if (visiting.has(file)) {
    const cycleStart = stack.indexOf(file);
    errors.push([...stack.slice(cycleStart), file].join(" -> "));
    return;
  }

  if (visited.has(file)) {
    return;
  }

  visiting.add(file);

  for (const dependency of graph.get(file) ?? []) {
    visitFile(dependency, graph, visiting, visited, [...stack, file], errors);
  }

  visiting.delete(file);
  visited.add(file);
}

function resolveRelativeImport(sourcePath: string, importPath: string, knownPaths: Set<string>): string | undefined {
  const normalized = resolveRelativePathWithoutExtension(sourcePath, importPath);
  const candidates = [normalized, `${normalized}.ts`, `${normalized}/index.ts`];

  return candidates.find((candidate) => knownPaths.has(candidate));
}

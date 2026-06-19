export type SourceFile = {
  readonly path: string;
  readonly content: string;
};

export function extractImports(content: string): readonly string[] {
  const imports: string[] = [];

  for (const line of content.split(/\r?\n/u)) {
    const importPath = extractImportPath(line.trim());

    if (importPath) {
      imports.push(importPath);
    }
  }

  return imports;
}

function extractImportPath(line: string): string | undefined {
  if (!line.startsWith("import")) {
    return undefined;
  }

  const fromMarker = " from ";
  const fromIndex = line.lastIndexOf(fromMarker);
  const specifier = fromIndex >= 0 ? line.slice(fromIndex + fromMarker.length).trim() : line.slice("import".length).trim();

  return readQuotedSpecifier(specifier);
}

export function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replaceAll(/^\.\//g, "");
}

export function resolveRelativePathWithoutExtension(sourcePath: string, importPath: string): string {
  const sourceDirectory = sourcePath.split("/").slice(0, -1);
  const parts = [...sourceDirectory, ...importPath.split("/")];
  const normalizedParts: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      normalizedParts.pop();
    } else if (part && part !== ".") {
      normalizedParts.push(part);
    } else {
      // Empty and current-directory path segments do not affect the normalized path.
    }
  }

  return normalizedParts.join("/");
}

function readQuotedSpecifier(value: string): string | undefined {
  const quote = value[0];

  if (quote !== "\"" && quote !== "'") {
    return undefined;
  }

  const endIndex = value.indexOf(quote, 1);

  return endIndex > 1 ? value.slice(1, endIndex) : undefined;
}

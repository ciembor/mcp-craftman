import { formatErrorList } from "../registry/registry-validation.js";
import { extractImports, type SourceFile } from "./source-files.js";

type CleanArchitectureLayer = "domain" | "application" | "mcp" | "infrastructure";

type LayerImportRule = {
  readonly blockedImportSegment: string;
  readonly message: string;
};

const cleanArchitectureRules: Readonly<Record<CleanArchitectureLayer, readonly LayerImportRule[]>> = {
  application: [
    {
      blockedImportSegment: "/mcp",
      message: "imports MCP",
    },
    {
      blockedImportSegment: "/infrastructure",
      message: "imports infrastructure",
    },
    {
      blockedImportSegment: "@modelcontextprotocol",
      message: "imports MCP SDK",
    },
  ],
  domain: [
    {
      blockedImportSegment: "/mcp",
      message: "imports MCP",
    },
    {
      blockedImportSegment: "@modelcontextprotocol",
      message: "imports MCP SDK",
    },
  ],
  infrastructure: [],
  mcp: [
    {
      blockedImportSegment: "/infrastructure",
      message: "imports infrastructure",
    },
  ],
};

export function assertCleanArchitectureLayers(files: readonly SourceFile[]): void {
  const errors = validateCleanArchitectureLayers(files);

  if (errors.length > 0) {
    throw new Error(`Clean architecture violations:\n${formatErrorList(errors)}`);
  }
}

function validateCleanArchitectureLayers(files: readonly SourceFile[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const layer = getLayer(file.path);
    const imports = extractImports(file.content);

    if (!layer) {
      continue;
    }

    for (const importPath of imports) {
      validateLayerImport(file.path, layer, importPath, errors);
    }
  }

  return errors;
}

function validateLayerImport(
  filePath: string,
  layer: CleanArchitectureLayer,
  importPath: string,
  errors: string[],
): void {
  for (const rule of cleanArchitectureRules[layer]) {
    if (importPath.includes(rule.blockedImportSegment)) {
      errors.push(`${filePath} ${rule.message} from ${importPath}.`);
    }
  }
}

function getLayer(path: string): CleanArchitectureLayer | undefined {
  if (path.includes("/domain/")) {
    return "domain";
  }

  if (path.includes("/application/")) {
    return "application";
  }

  if (path.includes("/mcp/")) {
    return "mcp";
  }

  if (path.includes("/infrastructure/")) {
    return "infrastructure";
  }

  return undefined;
}

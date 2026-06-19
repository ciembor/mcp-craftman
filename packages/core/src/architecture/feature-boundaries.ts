import { formatErrorList } from "../registry/registry-validation.js";
import { extractImports, resolveRelativePathWithoutExtension, type SourceFile } from "./source-files.js";

export function assertFeatureBoundaries(files: readonly SourceFile[]): void {
  const errors = validateFeatureBoundaries(files);

  if (errors.length > 0) {
    throw new Error(`Feature boundary violations:\n${formatErrorList(errors)}`);
  }
}

function validateFeatureBoundaries(files: readonly SourceFile[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const sourceFeature = getFeatureName(file.path);

    if (!sourceFeature) {
      continue;
    }

    for (const importPath of extractImports(file.content)) {
      const normalizedImportPath = importPath.startsWith(".")
        ? resolveRelativePathWithoutExtension(file.path, importPath)
        : importPath;
      const targetFeature = getImportedFeatureName(normalizedImportPath);

      if (
        targetFeature &&
        targetFeature !== sourceFeature &&
        !normalizedImportPath.endsWith(`/features/${targetFeature}`)
      ) {
        errors.push(`${file.path} imports feature "${targetFeature}" without using its index.ts boundary.`);
      }
    }
  }

  return errors;
}

function getFeatureName(path: string): string | undefined {
  return path.match(/(?:^|\/)features\/([^/]+)\//)?.[1];
}

function getImportedFeatureName(path: string): string | undefined {
  return path.match(/(?:^|\/)features\/([^/]+)(?:\/|$)/)?.[1];
}

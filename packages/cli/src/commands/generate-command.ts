import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { createFeatureFiles } from "../code-generator/feature-template.js";

export type GenerateFeatureOptions = {
  readonly name: string;
  readonly path?: string;
};

export async function generateFeature(options: GenerateFeatureOptions): Promise<void> {
  const projectPath = resolve(options.path ?? ".");
  const files = createFeatureFiles(options.name);

  await Promise.all(
    files.map(async (file) => {
      const targetPath = join(projectPath, file.path);
      await assertMissing(targetPath);
      await mkdir(dirname(targetPath), {
        recursive: true,
      });
      await writeFile(targetPath, file.content);
    }),
  );
}

export function parseGenerateArgs(args: readonly string[]): GenerateFeatureOptions {
  const [kind, name, ...rest] = args;

  if (kind !== "feature" || !name) {
    throw new Error("Usage: mcp-craftman generate feature <name> [--path <path>]");
  }

  const pathFlagIndex = rest.indexOf("--path");
  const path = pathFlagIndex >= 0 ? rest[pathFlagIndex + 1] : undefined;

  return path === undefined
    ? {
        name,
      }
    : {
        name,
        path,
      };
}

async function assertMissing(path: string): Promise<void> {
  try {
    await stat(path);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }

  throw new Error(`Refusing to overwrite existing file: ${path}`);
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

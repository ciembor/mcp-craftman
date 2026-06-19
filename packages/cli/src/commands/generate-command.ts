import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { createFeatureFiles } from "../code-generator/feature-template.js";
import { createGeneratedNames } from "../code-generator/name-style.js";
import { updateRegistrySource } from "../code-generator/registry-updater.js";

export type GenerateFeatureOptions = {
  readonly name: string;
  readonly register?: boolean;
  readonly path?: string;
};

export async function generateFeature(options: GenerateFeatureOptions): Promise<void> {
  const projectPath = resolve(options.path ?? ".");
  const files = createFeatureFiles(options.name);
  const names = createGeneratedNames(options.name);
  const registryPath = join(projectPath, "src", "mcp", "registry.ts");
  const updatedRegistry = (options.register ?? true) ? await createUpdatedRegistry(registryPath, names) : undefined;
  const targetFiles = files.map((file) => ({
    ...file,
    targetPath: join(projectPath, file.path),
  }));

  await Promise.all(targetFiles.map((file) => assertMissing(file.targetPath)));

  await Promise.all(
    targetFiles.map(async (file) => {
      await mkdir(dirname(file.targetPath), {
        recursive: true,
      });
      await writeFile(file.targetPath, file.content);
    }),
  );

  if (updatedRegistry !== undefined) {
    await writeFile(registryPath, updatedRegistry);
  }
}

export function parseGenerateArgs(args: readonly string[]): GenerateFeatureOptions {
  const [kind, name, ...rest] = args;

  if (kind !== "feature" || !name) {
    throw new Error("Usage: mcp-craftman generate feature <name> [--path <path>] [--no-register]");
  }

  const pathFlagIndex = rest.indexOf("--path");
  const path = pathFlagIndex >= 0 ? rest[pathFlagIndex + 1] : undefined;
  const register = !rest.includes("--no-register");

  return path === undefined
    ? {
        name,
        register,
      }
    : {
        name,
        register,
        path,
      };
}

async function createUpdatedRegistry(registryPath: string, names: ReturnType<typeof createGeneratedNames>): Promise<string> {
  const source = await readFile(registryPath, "utf8");

  return updateRegistrySource(source, names);
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

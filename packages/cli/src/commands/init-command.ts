import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { installPreCommitHook } from "../git-hooks/install-pre-commit-hook.js";
import { createProjectFiles } from "../project-generator/create-project-files.js";

export type InitProjectOptions = {
  readonly path: string;
  readonly name: string;
};

export async function initProject(options: InitProjectOptions): Promise<void> {
  const projectPath = resolve(options.path);
  const files = createProjectFiles(options.name);

  await Promise.all(
    files.map(async (file) => {
      const targetPath = join(projectPath, file.path);
      await mkdir(dirname(targetPath), {
        recursive: true,
      });
      await writeFile(targetPath, file.content);
    }),
  );

  await installPreCommitHook(projectPath);
}

export function parseInitArgs(args: readonly string[]): InitProjectOptions {
  const path = args[0];
  const nameFlagIndex = args.indexOf("--name");
  const name = nameFlagIndex >= 0 ? args[nameFlagIndex + 1] : undefined;

  if (!path || !name) {
    throw new Error("Usage: mcp-craftman init <path> --name <name>");
  }

  return {
    path,
    name,
  };
}

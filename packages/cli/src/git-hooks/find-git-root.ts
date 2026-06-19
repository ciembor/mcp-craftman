import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function findGitRoot(startPath: string): Promise<string | undefined> {
  let currentPath = startPath;

  while (true) {
    if (await pathExists(join(currentPath, ".git"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      return undefined;
    }

    currentPath = parentPath;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

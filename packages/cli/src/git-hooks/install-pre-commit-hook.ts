import { chmod, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { findGitRoot } from "./find-git-root.js";

export async function installPreCommitHook(projectPath: string): Promise<void> {
  const gitRoot = await findGitRoot(projectPath);

  if (!gitRoot) {
    return;
  }

  const hookPath = join(gitRoot, ".git", "hooks", "pre-commit");

  await writeFile(
    hookPath,
    `#!/bin/sh
set -e
pnpm quality
`,
  );
  await chmod(hookPath, 0o755);
}

import { mkdir, open, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export async function withLock<T>(
  lockPath: string,
  callback: () => T | Promise<T>,
  options: { readonly retries?: number; readonly retryDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 20;
  const retryDelayMs = options.retryDelayMs ?? 50;

  await mkdir(dirname(lockPath), {
    recursive: true,
  });

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");

      try {
        return await callback();
      } finally {
        await handle.close();
        await rm(lockPath, {
          force: true,
        });
      }
    } catch (error) {
      if (!isFileExistsError(error) || attempt === retries) {
        throw error;
      }

      await delay(retryDelayMs);
    }
  }

  throw new Error(`Could not acquire lock: ${lockPath}`);
}

function isFileExistsError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

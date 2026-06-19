import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function atomicWrite(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), {
    recursive: true,
  });

  const temporaryPath = join(dirname(path), `.${process.pid}.${Date.now()}.${randomUUID()}.tmp`);

  try {
    await writeFile(temporaryPath, data);
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, {
      force: true,
    });
    throw error;
  }
}

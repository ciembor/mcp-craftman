import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { atomicWrite, withLock } from "../../src/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map((path) =>
      rm(path, {
        recursive: true,
        force: true,
      }),
    ),
  );
  tempDirs.length = 0;
});

describe("@mcp-craftman/node filesystem", () => {
  it("writes files atomically and creates parent directories", async () => {
    const directory = await createTempDir();
    const path = join(directory, "nested", "manifest.json");

    await atomicWrite(path, JSON.stringify({ ok: true }));

    await expect(readFile(path, "utf8")).resolves.toBe('{"ok":true}');
  });

  it("runs a callback under a filesystem lock", async () => {
    const directory = await createTempDir();
    const lockPath = join(directory, "sync.lock");
    const calls: string[] = [];

    const result = await withLock(lockPath, () => {
      calls.push("locked");
      return 42;
    });

    expect(result).toBe(42);
    expect(calls).toEqual(["locked"]);
    await expect(readFile(lockPath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-craftman-node-"));
  tempDirs.push(path);
  return path;
}

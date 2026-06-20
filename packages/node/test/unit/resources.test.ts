import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createLocalResourceStore,
  createResourceSnapshot,
  readResourceManifest,
  runLocalResourceSync,
  withResourceLock,
  writeStagedResourceFile,
} from "../../src/index.js";

const tempDirs: string[] = [];
const dataFilePath = "index/data.json";
const firstSnapshotId = "snapshot-1";
const secondSnapshotId = "snapshot-2";

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

describe("@mcp-craftman/node local resources", () => {
  it("syncs a missing resource into the current directory and manifest", async () => {
    const directory = await createTempDir();
    const store = createLocalResourceStore(join(directory, "dictionary"));

    const result = await syncFixtureResource(store);

    expect(result).toEqual({
      manifest: {
        current: {
          createdAt: "2026-01-02T03:04:05.000Z",
          files: [dataFilePath],
          id: firstSnapshotId,
          metadata: {
            source: "fixture",
          },
        },
      },
      status: "synced",
    });
    await expect(readFile(join(store.currentDir, "index", "data.json"), "utf8")).resolves.toBe("{\"ok\":true}");
    await expect(readResourceManifest(store)).resolves.toEqual(result.manifest);
  });

  it("skips existing resources unless stale or force mode is used", async () => {
    const directory = await createTempDir();
    const store = createLocalResourceStore(join(directory, "cache"));

    await runLocalResourceSync({
      store,
      sync: () => createResourceSnapshot({ id: firstSnapshotId }),
    });

    await expect(
      runLocalResourceSync({
        store,
        sync: () => createResourceSnapshot({ id: secondSnapshotId }),
      }),
    ).resolves.toMatchObject({
      manifest: {
        current: {
          id: firstSnapshotId,
        },
      },
      status: "skipped",
    });

    await expect(
      runLocalResourceSync({
        store,
        shouldSync: () => true,
        mode: "stale",
        sync: () => createResourceSnapshot({ id: secondSnapshotId }),
      }),
    ).resolves.toMatchObject({
      manifest: {
        current: {
          id: secondSnapshotId,
        },
      },
      status: "synced",
    });
  });

  it("rejects staged paths that escape the resource root", async () => {
    const directory = await createTempDir();
    const store = createLocalResourceStore(join(directory, "cache"));

    await expect(writeStagedResourceFile(store, "../escape.txt", "bad")).rejects.toThrow("Resource path escapes store root:");
  });

  it("runs callbacks under the resource lock", async () => {
    const store = createLocalResourceStore(await createTempDir());

    await expect(withResourceLock(store, () => "locked")).resolves.toBe("locked");
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-craftman-resource-"));
  tempDirs.push(path);
  return path;
}

async function syncFixtureResource(store: ReturnType<typeof createLocalResourceStore>) {
  return runLocalResourceSync({
    store,
    sync: async ({ store: syncStore }) => {
      await writeStagedResourceFile(syncStore, dataFilePath, "{\"ok\":true}");

      return createResourceSnapshot(
        {
          files: [dataFilePath],
          id: firstSnapshotId,
          metadata: {
            source: "fixture",
          },
        },
        new Date("2026-01-02T03:04:05.000Z"),
      );
    },
  });
}

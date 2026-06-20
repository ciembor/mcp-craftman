import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { dirname, join, normalize, relative, resolve } from "node:path";

import { atomicWrite } from "../filesystem/atomic-write.js";
import { withLock } from "../filesystem/lock-file.js";

export type LocalResourceStore = {
  readonly currentDir: string;
  readonly lockPath: string;
  readonly manifestPath: string;
  readonly rootDir: string;
  readonly stagingDir: string;
};

export type ResourceSnapshotInput = {
  readonly id: string;
  readonly files?: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

export type ResourceSnapshot = ResourceSnapshotInput & {
  readonly createdAt: string;
};

export type ResourceManifest = {
  readonly current?: ResourceSnapshot;
};

export function createLocalResourceStore(rootDir: string): LocalResourceStore {
  const resolvedRoot = resolve(rootDir);

  return {
    currentDir: join(resolvedRoot, "current"),
    lockPath: join(resolvedRoot, ".resource.lock"),
    manifestPath: join(resolvedRoot, "manifest.json"),
    rootDir: resolvedRoot,
    stagingDir: join(resolvedRoot, "staging"),
  };
}

export function createResourceSnapshot(input: ResourceSnapshotInput, now: Date = new Date()): ResourceSnapshot {
  return {
    ...input,
    createdAt: now.toISOString(),
  };
}

export async function readResourceManifest(store: LocalResourceStore): Promise<ResourceManifest> {
  try {
    return JSON.parse(await readFile(store.manifestPath, "utf8")) as ResourceManifest;
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }

    throw error;
  }
}

export async function writeResourceManifest(store: LocalResourceStore, manifest: ResourceManifest): Promise<void> {
  await atomicWrite(store.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function withResourceLock<T>(store: LocalResourceStore, callback: () => T | Promise<T>): Promise<T> {
  return withLock(store.lockPath, callback);
}

export async function writeStagedResourceFile(
  store: LocalResourceStore,
  relativePath: string,
  data: string | Uint8Array,
): Promise<void> {
  const targetPath = resolveResourcePath(store.stagingDir, relativePath);
  await mkdir(dirname(targetPath), {
    recursive: true,
  });
  await atomicWrite(targetPath, data);
}

export async function commitStagedResource(store: LocalResourceStore, snapshot: ResourceSnapshot): Promise<ResourceManifest> {
  const backupDir = join(store.rootDir, "previous");

  await prepareSwap(store, backupDir);

  try {
    await rename(store.stagingDir, store.currentDir);
    const manifest = {
      current: snapshot,
    };
    await writeResourceManifest(store, manifest);
    await rm(backupDir, {
      force: true,
      recursive: true,
    });

    return manifest;
  } catch (error) {
    await restoreBackup(store, backupDir);
    throw error;
  }
}

async function prepareSwap(store: LocalResourceStore, backupDir: string): Promise<void> {
  await mkdir(store.rootDir, {
    recursive: true,
  });
  await rm(backupDir, {
    force: true,
    recursive: true,
  });

  try {
    await rename(store.currentDir, backupDir);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

async function restoreBackup(store: LocalResourceStore, backupDir: string): Promise<void> {
  await rm(store.currentDir, {
    force: true,
    recursive: true,
  });

  try {
    await rename(backupDir, store.currentDir);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function resolveResourcePath(rootDir: string, relativePath: string): string {
  const targetPath = resolve(rootDir, normalize(relativePath));

  if (relative(rootDir, targetPath).startsWith("..")) {
    throw new Error(`Resource path escapes store root: ${relativePath}`);
  }

  return targetPath;
}

import { mkdir, rm } from "node:fs/promises";

import {
  commitStagedResource,
  readResourceManifest,
  withResourceLock,
  type LocalResourceStore,
  type ResourceManifest,
  type ResourceSnapshot,
} from "./resource-store.js";

export type LocalResourceSyncMode = "missing" | "stale" | "force";

export type LocalResourceSyncContext = {
  readonly manifest: ResourceManifest;
  readonly store: LocalResourceStore;
};

export type LocalResourceSyncOptions = {
  readonly mode?: LocalResourceSyncMode;
  readonly shouldSync?: (context: LocalResourceSyncContext) => boolean | Promise<boolean>;
  readonly store: LocalResourceStore;
  readonly sync: (context: LocalResourceSyncContext) => ResourceSnapshot | Promise<ResourceSnapshot>;
};

export type LocalResourceSyncResult = {
  readonly manifest: ResourceManifest;
  readonly status: "skipped" | "synced";
};

export async function runLocalResourceSync(options: LocalResourceSyncOptions): Promise<LocalResourceSyncResult> {
  return withResourceLock(options.store, async () => {
    const manifest = await readResourceManifest(options.store);
    const context = {
      manifest,
      store: options.store,
    };

    if (!(await shouldRunSync(options, context))) {
      return {
        manifest,
        status: "skipped",
      };
    }

    await prepareStaging(options.store);
    const snapshot = await options.sync(context);

    return {
      manifest: await commitStagedResource(options.store, snapshot),
      status: "synced",
    };
  });
}

async function shouldRunSync(options: LocalResourceSyncOptions, context: LocalResourceSyncContext): Promise<boolean> {
  const mode = options.mode ?? "missing";

  if (mode === "force") {
    return true;
  }

  if (context.manifest.current === undefined) {
    return true;
  }

  return mode === "stale" && options.shouldSync !== undefined && (await options.shouldSync(context));
}

async function prepareStaging(store: LocalResourceStore): Promise<void> {
  await rm(store.stagingDir, {
    force: true,
    recursive: true,
  });
  await mkdir(store.stagingDir, {
    recursive: true,
  });
}

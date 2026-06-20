import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadProjectConfig } from "../../src/index.js";

const tempDirs: string[] = [];
const rcConfigFileName = ".mcp-craftmanrc";

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

describe("@mcp-craftman/cli project config", () => {
  it("returns an empty config when no project config exists", async () => {
    await expect(loadProjectConfig({ cwd: await createTempDir() })).resolves.toEqual({
      config: {},
    });
  });

  it("loads config from package.json", async () => {
    const directory = await createTempDir();
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({
        "mcp-craftman": {
          generatedTools: {
            schema: "zod",
          },
        },
      }),
    );

    await expect(loadProjectConfig({ cwd: directory })).resolves.toMatchObject({
      config: {
        generatedTools: {
          schema: "zod",
        },
      },
      filepath: join(directory, "package.json"),
    });
  });

  it("loads config from rc files", async () => {
    const directory = await createTempDir();
    await writeFile(
      join(directory, rcConfigFileName),
      JSON.stringify({
        quality: {
          strict: true,
        },
      }),
    );

    await expect(loadProjectConfig({ cwd: directory })).resolves.toMatchObject({
      config: {
        quality: {
          strict: true,
        },
      },
      filepath: join(directory, rcConfigFileName),
    });
  });

  it("loads config from TypeScript config files", async () => {
    const directory = await createTempDir();
    await writeFile(
      join(directory, "mcp-craftman.config.ts"),
      `export default {
  features: {
    generatedSchema: "zod",
  },
};
`,
    );

    await expect(loadProjectConfig({ cwd: directory })).resolves.toMatchObject({
      config: {
        features: {
          generatedSchema: "zod",
        },
      },
      filepath: join(directory, "mcp-craftman.config.ts"),
    });
  });

  it("rejects non-object config", async () => {
    const directory = await createTempDir();
    await writeFile(join(directory, rcConfigFileName), "[]");

    await expect(loadProjectConfig({ cwd: directory })).rejects.toThrow("MCP Craftman project config must be an object.");
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-craftman-config-"));
  tempDirs.push(path);
  return path;
}

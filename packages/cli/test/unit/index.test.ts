import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import {
  createFeatureFiles,
  createProjectFiles,
  generateFeature,
  getQualitySteps,
  initProject,
  parseGenerateArgs,
  runQuality,
} from "../../src/index.js";

const tempDirs: string[] = [];
const sourceStatusContractPath = "test/contracts/source-status.contract.test.ts";
const searchPlacesFeatureName = "search-places";

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

describe("@mcp-craftman/cli quality", () => {
  it("defines the exact quality command sequence", async () => {
    const calls: string[] = [];

    await runQuality(async (command, args) => {
      calls.push([command, ...args].join(" "));
    });

    expect(calls).toEqual([
      "knip",
      "tsc --noEmit",
      "eslint . --fix",
      "dependency-cruiser --config dependency-cruiser.config.cjs .",
      "vitest run test/architecture",
      "vitest run --coverage test/unit test/integration test/contracts",
    ]);
    expect(getQualitySteps()).toHaveLength(6);
  });
});

describe("@mcp-craftman/cli project generator", () => {
  it("generates the expected server file set", () => {
    const files = createProjectFiles("TERYT MCP").map((file) => file.path);

    expect(files).toEqual(
      expect.arrayContaining([
        "src/app.ts",
        "src/main.ts",
        "src/mcp/registry.ts",
        "src/server/transports/http.ts",
        "src/server/transports/stdio.ts",
        "src/features/health/index.ts",
        "src/features/health/domain/health-status.ts",
        "src/features/health/application/get-health.ts",
        "src/features/health/mcp/health.tool.ts",
        "test/architecture/project.architecture.test.ts",
        "test/contracts/health.contract.test.ts",
        "test/integration/app.smoke.test.ts",
        "dependency-cruiser.config.cjs",
        "eslint.config.js",
        "knip.json",
        "vitest.config.ts",
      ]),
    );
  });
});

describe("@mcp-craftman/cli feature generator", () => {
  it("generates a feature skeleton", () => {
    const files = createFeatureFiles("Source Status");

    expect(files.map((file) => file.path)).toEqual([
      "src/features/source-status/index.ts",
      "src/features/source-status/domain/source-status-result.ts",
      "src/features/source-status/application/source-status.ts",
      "src/features/source-status/mcp/source-status.tool.ts",
      sourceStatusContractPath,
    ]);
    expect(files.find((file) => file.path.endsWith("source-status.tool.ts"))?.content).toContain('name: "source_status"');
  });

  it("parses feature generation arguments", () => {
    expect(parseGenerateArgs(["feature", searchPlacesFeatureName, "--path", "server"])).toEqual({
      name: searchPlacesFeatureName,
      path: "server",
    });
    expect(() => parseGenerateArgs(["tool", searchPlacesFeatureName])).toThrow(
      "Usage: mcp-craftman generate feature <name> [--path <path>]",
    );
  });

  it("generates a feature on disk without overwriting existing files", async () => {
    const directory = await createTempDir();

    await generateFeature({
      path: directory,
      name: "source status",
    });

    await expect(readFile(join(directory, "src/features/source-status/index.ts"), "utf8")).resolves.toContain(
      "sourceStatusTool",
    );
    await expect(readFile(join(directory, sourceStatusContractPath), "utf8")).resolves.toContain(
      'callTool(createApp(), "source_status", {})',
    );
    await expect(
      generateFeature({
        path: directory,
        name: "source status",
      }),
    ).rejects.toThrow("Refusing to overwrite existing file:");
  });
});

describe("@mcp-craftman/cli init command", () => {
  it("initializes a project on disk", async () => {
    const directory = await createTempDir();
    const projectPath = join(directory, "teryt");

    await initProject({
      path: projectPath,
      name: "TERYT MCP",
    });

    await expect(stat(join(projectPath, "src/app.ts"))).resolves.toMatchObject({
      isFile: expect.any(Function),
    });
    await expect(readFile(join(projectPath, "package.json"), "utf8")).resolves.toContain('"name": "teryt-mcp"');
    await expect(readFile(join(projectPath, "src/mcp/registry.ts"), "utf8")).resolves.toContain("healthTool");
  });

  it("installs a root pre-commit hook that runs pnpm quality", async () => {
    const directory = await createTempDir();
    await mkdir(join(directory, ".git", "hooks"), {
      recursive: true,
    });

    await initProject({
      path: join(directory, "servers", "teryt"),
      name: "teryt-mcp",
    });

    await expect(readFile(join(directory, ".git", "hooks", "pre-commit"), "utf8")).resolves.toBe(`#!/bin/sh
set -e
pnpm quality
`);
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-craftman-cli-"));
  tempDirs.push(path);
  return path;
}

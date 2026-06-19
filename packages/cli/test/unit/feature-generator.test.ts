import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createFeatureFiles,
  createGeneratedNames,
  generateFeature,
  initProject,
  parseGenerateArgs,
  updateRegistrySource,
} from "../../src/index.js";

const tempDirs: string[] = [];
const sourceStatusContractPath = "test/contracts/source-status.contract.test.ts";
const searchPlacesFeatureName = "search-places";
const sourceStatusFeatureName = "source status";
const sourceStatusIndexPath = "src/features/source-status/index.ts";
const sourceStatusToolName = "sourceStatusTool";

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

describe("@mcp-craftman/cli feature generator files", () => {
  it("generates a feature skeleton", () => {
    const files = createFeatureFiles("Source Status");

    expect(files.map((file) => file.path)).toEqual([
      sourceStatusIndexPath,
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
      register: true,
      path: "server",
    });
    expect(parseGenerateArgs(["feature", searchPlacesFeatureName, "--no-register"])).toEqual({
      name: searchPlacesFeatureName,
      register: false,
    });
    expect(() => parseGenerateArgs(["tool", searchPlacesFeatureName])).toThrow(
      "Usage: mcp-craftman generate feature <name> [--path <path>] [--no-register]",
    );
  });
});

describe("@mcp-craftman/cli feature registry updater", () => {
  it("registers generated feature tools in a registry source", () => {
    const source = `import { createCapabilityRegistry } from "@mcp-craftman/core";

import { healthTool } from "../features/health/index.js";

export const registry = createCapabilityRegistry([
  healthTool,
]);
`;

    expect(updateRegistrySource(source, createGeneratedNames(sourceStatusFeatureName))).toBe(`import { createCapabilityRegistry } from "@mcp-craftman/core";

import { healthTool } from "../features/health/index.js";
import { sourceStatusTool } from "../features/source-status/index.js";

export const registry = createCapabilityRegistry([
  healthTool,
  sourceStatusTool,
]);
`);
  });

  it("keeps registry updates idempotent", () => {
    const source = `import { createCapabilityRegistry } from "@mcp-craftman/core";

import { sourceStatusTool } from "../features/source-status/index.js";

export const registry = createCapabilityRegistry([
  sourceStatusTool,
]);
`;

    expect(updateRegistrySource(source, createGeneratedNames(sourceStatusFeatureName))).toBe(source);
  });
});

describe("@mcp-craftman/cli feature generator on disk", () => {
  it("generates a feature on disk and registers it", async () => {
    const directory = await createTempDir();
    await initProject({
      path: directory,
      name: "test-server",
    });

    await generateFeature({
      path: directory,
      name: sourceStatusFeatureName,
    });

    await expect(readFile(join(directory, sourceStatusIndexPath), "utf8")).resolves.toContain(sourceStatusToolName);
    await expect(readFile(join(directory, sourceStatusContractPath), "utf8")).resolves.toContain(
      'callTool(createApp(), "source_status", {})',
    );
    await expect(readFile(join(directory, "src/mcp/registry.ts"), "utf8")).resolves.toContain(sourceStatusToolName);
  });

  it("refuses to overwrite existing feature files", async () => {
    const directory = await createTempDir();
    await initProject({
      path: directory,
      name: "test-server",
    });
    await generateFeature({
      path: directory,
      name: sourceStatusFeatureName,
    });

    await expect(
      generateFeature({
        path: directory,
        name: sourceStatusFeatureName,
      }),
    ).rejects.toThrow("Refusing to overwrite existing file:");
  });
});

async function createTempDir(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "mcp-craftman-cli-"));
  tempDirs.push(path);
  return path;
}

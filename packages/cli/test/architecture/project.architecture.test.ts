import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { getQualitySteps } from "../../src/index.js";

describe("@mcp-craftman/cli architecture", () => {
  it("keeps the public API behind one barrel entrypoint and a separate executable", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual([
      "cli.ts",
      "code-generator",
      "commands",
      "git-hooks",
      "index.ts",
      "main.ts",
      "project-generator",
      "quality",
    ]);

    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
    expect(indexSource).not.toContain("process.");
  });

  it("keeps generated quality checks aligned with the required order", () => {
    expect(getQualitySteps().map(([command, args]) => [command, ...args].join(" "))).toEqual([
      "knip",
      "tsc --noEmit",
      "eslint . --fix",
      "dependency-cruiser --config dependency-cruiser.config.cjs .",
      "vitest run test/architecture",
      "vitest run --coverage test/unit test/integration test/contracts",
    ]);
  });

  it("does not import private framework paths or server code", async () => {
    const sources = await Promise.all(
      [
        "../../src/index.ts",
        "../../src/main.ts",
        "../../src/commands/generate-command.ts",
        "../../src/code-generator/registry-updater.ts",
        "../../src/commands/init-command.ts",
        "../../src/commands/quality-command.ts",
        "../../src/code-generator/feature-template.ts",
        "../../src/project-generator/create-project-files.ts",
        "../../src/project-generator/source-template.ts",
        "../../src/quality/quality-runner.ts",
      ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    for (const source of sources) {
      expect(source).not.toContain("@mcp-craftman/core/src");
      expect(source).not.toContain("@mcp-craftman/node/src");
      expect(source).not.toContain("servers/");
    }
  });

  it("locks package exports to the public root only", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
      readonly bin: Record<string, string>;
      readonly exports: Record<string, unknown>;
      readonly files: readonly string[];
    };

    expect(Object.keys(packageJson.exports)).toEqual(["."]);
    expect(packageJson.files).toEqual(["dist"]);
    expect(packageJson.bin).toEqual({
      "mcp-craftman": "dist/cli.js",
    });
  });
});

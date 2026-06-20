import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftsman/core architecture", () => {
  it("keeps the public API behind one barrel entrypoint", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual([
      "architecture",
      "capabilities",
      "index.ts",
      "registry",
      "testing",
    ]);

    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
  });

  it("does not depend on Node.js runtime APIs", async () => {
    const sources = await Promise.all(
      [
        "../../src/index.ts",
        "../../src/capabilities/define-tool.ts",
        "../../src/capabilities/input.ts",
        "../../src/capabilities/types.ts",
        "../../src/registry/capability-registry.ts",
        "../../src/registry/registry-validation.ts",
        "../../src/architecture/source-files.ts",
        "../../src/architecture/dependency-cycles.ts",
        "../../src/architecture/feature-boundaries.ts",
        "../../src/architecture/clean-architecture-layers.ts",
        "../../src/testing/call-tool.ts",
        "../../src/testing/create-test-app.ts",
      ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    for (const source of sources) {
      expect(source).not.toContain("from \"node:");
      expect(source).not.toContain("process.");
    }
  });

  it("locks package exports to the public root only", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
      readonly exports: Record<string, unknown>;
      readonly files: readonly string[];
    };

    expect(Object.keys(packageJson.exports)).toEqual(["."]);
    expect(packageJson.files).toEqual(["dist"]);
  });
});

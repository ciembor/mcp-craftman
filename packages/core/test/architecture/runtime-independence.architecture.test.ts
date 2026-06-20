import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourceFiles = [
  "../../src/index.ts",
  "../../src/capabilities/define-tool.ts",
  "../../src/capabilities/types.ts",
  "../../src/registry/capability-registry.ts",
  "../../src/registry/registry-validation.ts",
  "../../src/architecture/source-files.ts",
  "../../src/architecture/dependency-cycles.ts",
  "../../src/architecture/feature-boundaries.ts",
  "../../src/architecture/clean-architecture-layers.ts",
  "../../src/testing/call-tool.ts",
  "../../src/testing/create-test-app.ts",
];

describe("@mcp-craftsman/core runtime independence", () => {
  it("does not import Node.js runtime APIs", async () => {
    const sources = await Promise.all(sourceFiles.map((path) => readFile(new URL(path, import.meta.url), "utf8")));

    for (const source of sources) {
      expect(source).not.toContain("from \"node:");
      expect(source).not.toContain("process.");
    }
  });
});

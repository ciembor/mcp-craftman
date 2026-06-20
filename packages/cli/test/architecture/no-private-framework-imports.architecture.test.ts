import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const sourceFiles = [
  "../../src/index.ts",
  "../../src/main.ts",
  "../../src/commands/init-command.ts",
  "../../src/commands/quality-command.ts",
  "../../src/project-generator/create-project-files.ts",
  "../../src/project-generator/source-template.ts",
  "../../src/quality/quality-runner.ts",
];

describe("@mcp-craftsman/cli private import boundaries", () => {
  it("does not import private framework paths or server code", async () => {
    const sources = await Promise.all(sourceFiles.map((path) => readFile(new URL(path, import.meta.url), "utf8")));

    for (const source of sources) {
      expect(source).not.toContain("@mcp-craftsman/core/");
      expect(source).not.toContain("@mcp-craftsman/node/");
      expect(source).not.toContain("servers/");
    }
  });
});

import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftman/cli public API", () => {
  it("keeps public exports separate from the executable", async () => {
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
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
      readonly bin: Record<string, string>;
      readonly exports: Record<string, unknown>;
      readonly files: readonly string[];
    };

    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
    expect(indexSource).not.toContain("process.");
    expect(Object.keys(packageJson.exports)).toEqual(["."]);
    expect(packageJson.bin).toEqual({ "mcp-craftman": "dist/cli.js" });
    expect(packageJson.files).toEqual(["dist"]);
  });
});

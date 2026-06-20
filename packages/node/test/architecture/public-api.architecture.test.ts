import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftman/node public API", () => {
  it("exports only through the package root barrel", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual([
      "cli",
      "filesystem",
      "index.ts",
      "logging",
      "resources",
      "runtime",
      "server",
      "setup",
      "transports",
    ]);

    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
      readonly exports: Record<string, unknown>;
      readonly files: readonly string[];
    };

    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
    expect(Object.keys(packageJson.exports)).toEqual(["."]);
    expect(packageJson.files).toEqual(["dist"]);
  });
});

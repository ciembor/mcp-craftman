import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftman/core public API", () => {
  it("exports only through the package root", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
      readonly exports: Record<string, unknown>;
      readonly files: readonly string[];
    };
    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(Object.keys(packageJson.exports)).toEqual(["."]);
    expect(packageJson.files).toEqual(["dist"]);
    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
  });
});

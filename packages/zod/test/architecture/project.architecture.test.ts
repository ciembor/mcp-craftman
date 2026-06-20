import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftsman/zod architecture", () => {
  it("keeps the public API behind one barrel entrypoint", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual(["index.ts"]);

    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(indexSource).toContain("defineZodTool");
    expect(indexSource).not.toContain("process.");
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

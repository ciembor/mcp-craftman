import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("@mcp-craftman/node architecture", () => {
  it("keeps the public API behind one barrel entrypoint", async () => {
    await expect(readdir(new URL("../../src", import.meta.url))).resolves.toEqual([
      "filesystem",
      "index.ts",
      "logging",
      "runtime",
      "transports",
    ]);

    const indexSource = await readFile(new URL("../../src/index.ts", import.meta.url), "utf8");

    expect(indexSource).not.toContain("function ");
    expect(indexSource).not.toContain("const ");
  });

  it("uses @mcp-craftman/core only through its package export", async () => {
    const sources = await Promise.all(
      [
        "../../src/transports/http/http-server.ts",
        "../../src/transports/stdio/json-rpc.ts",
        "../../src/transports/stdio/stdio-server.ts",
      ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    expect(sources.join("\n")).toContain("from \"@mcp-craftman/core\"");

    for (const source of sources) {
      expect(source).not.toContain("@mcp-craftman/core/src");
      expect(source).not.toContain("../core");
    }
  });

  it("keeps transports separate from filesystem runtime helpers", async () => {
    const sources = await Promise.all(
      [
        "../../src/transports/http/http-server.ts",
        "../../src/transports/http/json-body.ts",
        "../../src/transports/stdio/json-rpc.ts",
        "../../src/transports/stdio/stdio-server.ts",
      ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );

    for (const source of sources) {
      expect(source).not.toContain("filesystem/");
      expect(source).not.toContain("atomic-write");
      expect(source).not.toContain("lock-file");
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

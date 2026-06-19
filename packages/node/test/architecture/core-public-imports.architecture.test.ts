import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const filesThatUseCore = [
  "../../src/transports/http/http-server.ts",
  "../../src/transports/stdio/json-rpc.ts",
  "../../src/transports/stdio/stdio-server.ts",
];

describe("@mcp-craftman/node core imports", () => {
  it("uses @mcp-craftman/core only through its package export", async () => {
    const sources = await Promise.all(filesThatUseCore.map((path) => readFile(new URL(path, import.meta.url), "utf8")));

    expect(sources.join("\n")).toContain("from \"@mcp-craftman/core\"");

    for (const source of sources) {
      expect(source).not.toContain("@mcp-craftman/core/");
      expect(source).not.toContain("../core");
    }
  });
});

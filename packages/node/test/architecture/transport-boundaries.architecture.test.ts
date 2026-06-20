import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const transportFiles = [
  "../../src/transports/http/http-server.ts",
  "../../src/transports/http/json-body.ts",
  "../../src/transports/stdio/json-rpc.ts",
  "../../src/transports/stdio/stdio-server.ts",
];

describe("@mcp-craftsman/node transport boundaries", () => {
  it("keeps transports separate from filesystem helpers", async () => {
    const sources = await Promise.all(transportFiles.map((path) => readFile(new URL(path, import.meta.url), "utf8")));

    for (const source of sources) {
      expect(source).not.toContain("filesystem/");
      expect(source).not.toContain("atomic-write");
      expect(source).not.toContain("lock-file");
    }
  });
});

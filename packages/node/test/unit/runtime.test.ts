import { describe, expect, it } from "vitest";

import { loadRuntimeConfig, resolveDataDir } from "../../src/index.js";

describe("@mcp-craftman/node runtime", () => {
  it("loads runtime config from environment", () => {
    expect(
      loadRuntimeConfig({
        MCP_TRANSPORT: "http",
        MCP_PORT: "8787",
        MCP_DATA_DIR: "/tmp/teryt-mcp",
      }),
    ).toEqual({
      transport: "http",
      port: 8787,
      dataDir: "/tmp/teryt-mcp",
    });
  });

  it("resolves default data directory under XDG cache", () => {
    expect(
      resolveDataDir({
        XDG_CACHE_HOME: "/tmp/cache",
      }),
    ).toBe("/tmp/cache/mcp-craftman");
  });
});

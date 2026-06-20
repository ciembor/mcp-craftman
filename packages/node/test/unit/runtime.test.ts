import { describe, expect, it } from "vitest";

import { loadRuntimeConfig, resolveConfigDir, resolveDataDir } from "../../src/index.js";

const cacheRoot = "cache-root";

describe("@mcp-craftman/node runtime", () => {
  it("loads runtime config from environment", () => {
    expect(
      loadRuntimeConfig({
        MCP_TRANSPORT: "http",
        MCP_PORT: "8787",
        MCP_DATA_DIR: "teryt-data",
        MCP_CONFIG_DIR: "teryt-config",
        MCP_LOG_LEVEL: "debug",
      }),
    ).toEqual({
      transport: "http",
      port: 8787,
      dataDir: `${process.cwd()}/teryt-data`,
      configDir: `${process.cwd()}/teryt-config`,
      logLevel: "debug",
    });
  });

  it("loads runtime config with an application-specific data directory", () => {
    expect(
      loadRuntimeConfig({
        appName: "teryt-mcp",
        env: {
          MCP_TRANSPORT: "stdio",
          MCP_PORT: "8788",
          XDG_CACHE_HOME: cacheRoot,
          XDG_CONFIG_HOME: "config-root",
        },
      }),
    ).toEqual({
      transport: "stdio",
      port: 8788,
      dataDir: `${process.cwd()}/${cacheRoot}/teryt-mcp`,
      configDir: `${process.cwd()}/config-root/teryt-mcp`,
      logLevel: "info",
    });
  });

  it("resolves default data directory under XDG cache", () => {
    expect(
      resolveDataDir({
        XDG_CACHE_HOME: cacheRoot,
      }),
    ).toBe(`${process.cwd()}/${cacheRoot}/mcp-craftman`);
  });

  it("resolves application-specific data directory under XDG cache", () => {
    expect(
      resolveDataDir({
        appName: "teryt-mcp",
        env: {
          XDG_CACHE_HOME: cacheRoot,
        },
      }),
    ).toBe(`${process.cwd()}/${cacheRoot}/teryt-mcp`);
  });

  it("resolves application-specific config directory under XDG config", () => {
    expect(
      resolveConfigDir({
        appName: "teryt-mcp",
        env: {
          XDG_CONFIG_HOME: "config-root",
        },
      }),
    ).toBe(`${process.cwd()}/config-root/teryt-mcp`);
  });

  it("rejects invalid log levels", () => {
    expect(() =>
      loadRuntimeConfig({
        MCP_LOG_LEVEL: "verbose",
      }),
    ).toThrow("Invalid log level: verbose");
  });
});

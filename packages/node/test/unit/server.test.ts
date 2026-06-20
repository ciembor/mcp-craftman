import { PassThrough, Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import { createTestApp } from "@mcp-craftman/core";

import { createLogger, serveMcpApp } from "../../src/index.js";

const dataDir = "/tmp/mcp-craftman";

describe("@mcp-craftman/node server runtime", () => {
  it("starts HTTP from runtime config", async () => {
    const server = await serveMcpApp(() => createTestApp([]), {
      config: {
        dataDir,
        port: 0,
        transport: "http",
      },
    });

    expect("url" in server ? server.url : "").toMatch(/^http:\/\/127\.0\.0\.1:/);

    if ("close" in server) {
      await server.close();
    }
  });

  it("starts stdio from runtime config", async () => {
    const input = new PassThrough();
    const output = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    const server = await serveMcpApp(() => createTestApp([]), {
      config: {
        dataDir,
        port: 3000,
        transport: "stdio",
      },
      logger: createLogger(output),
      stdio: {
        input,
        output,
      },
    });

    expect(server.close).toEqual(expect.any(Function));
    server.close();
  });

  it("passes runtime config into the app factory", async () => {
    const createApp = vi.fn(() => createTestApp([]));
    const config = {
      dataDir,
      port: 0,
      transport: "http" as const,
    };
    const server = await serveMcpApp(createApp, {
      config,
    });

    expect(createApp).toHaveBeenCalledWith(config);

    if ("close" in server) {
      await server.close();
    }
  });
});

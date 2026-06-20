import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createTestApp, defineTool } from "@mcp-craftman/core";

import { callToolForCli, isCliEntrypoint, writeCliToolStructuredContent, writeJson } from "../../src/index.js";

describe("@mcp-craftman/node CLI helpers", () => {
  it("writes formatted JSON", () => {
    const stdout = new MemoryWritable();

    writeJson(stdout, {
      ok: true,
    });

    expect(stdout.content).toBe(`{
  "ok": true
}
`);
  });

  it("calls a tool using runtime config from CLI env", async () => {
    const result = await callToolForCli(createEchoApp, "echo_transport", {}, {
      MCP_TRANSPORT: "http",
      PORT: "3010",
    });

    expect(result.structuredContent).toEqual({
      transport: "http",
    });
  });

  it("writes tool structured content as JSON", async () => {
    const stdout = new MemoryWritable();

    await writeCliToolStructuredContent(stdout, createEchoApp, "echo_transport", {}, {
      MCP_TRANSPORT: "stdio",
    });

    expect(JSON.parse(stdout.content)).toEqual({
      transport: "stdio",
    });
  });

  it("detects package and compiled CLI entrypoints", () => {
    expect(isCliEntrypoint("teryt-mcp", "/usr/local/bin/teryt-mcp")).toBe(true);
    expect(isCliEntrypoint("teryt-mcp", "/project/dist/cli.js")).toBe(true);
    expect(isCliEntrypoint("teryt-mcp", "/project/dist/other.js")).toBe(false);
  });
});

function createEchoApp(config: { readonly transport: "stdio" | "http" }) {
  return createTestApp([
    defineTool({
      name: "echo_transport",
      policy: "read",
      outputSchema: {
        type: "object",
        properties: {
          transport: {
            type: "string",
          },
        },
        required: ["transport"],
      },
      returnsStructuredContent: true,
      annotations: {
        readOnlyHint: true,
      },
      handler: () => ({
        structuredContent: {
          transport: config.transport,
        },
      }),
    }),
  ]);
}

class MemoryWritable extends Writable {
  readonly chunks: string[] = [];

  get content(): string {
    return this.chunks.join("");
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString("utf8"));
    callback();
  }
}

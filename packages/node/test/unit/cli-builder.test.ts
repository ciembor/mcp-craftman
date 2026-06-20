import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createTestApp, defineTool } from "@mcp-craftsman/core";

import { createMcpCli, defineSetupTask, writeJson } from "../../src/index.js";

describe("@mcp-craftsman/node CLI builder status", () => {
  it("returns runtime status as JSON", async () => {
    const stdout = new MemoryWritable();
    const cli = createEchoCli();

    await cli.run(["status"], {
      env: {
        MCP_PORT: "3010",
        MCP_TRANSPORT: "http",
        XDG_CACHE_HOME: "cache-root",
      },
      stderr: new MemoryWritable(),
      stdout,
    });

    expect(JSON.parse(stdout.content)).toEqual({
      appName: "test-app",
      appVersion: "0.0.0",
      dataDir: `${process.cwd()}/cache-root/echo-app`,
      port: 3010,
      transport: "http",
    });
  });
});

describe("@mcp-craftsman/node CLI builder tools", () => {
  it("lists tools and calls tools as JSON", async () => {
    const stdout = new MemoryWritable();
    const cli = createEchoCli();

    await cli.run(["tools"], createIo(stdout));
    expect(JSON.parse(stdout.content)).toMatchObject({
      tools: [
        {
          name: "echo_transport",
          policy: "read",
        },
      ],
    });

    const callStdout = new MemoryWritable();
    await cli.run(["call", "echo_transport", "{}"], createIo(callStdout));
    expect(JSON.parse(callStdout.content)).toEqual({
      transport: "stdio",
    });
  });
});

describe("@mcp-craftsman/node CLI builder extensions", () => {
  it("runs setup tasks and custom commands", async () => {
    const stdout = new MemoryWritable();
    const calls: string[] = [];
    const cli = createEchoCli(calls);

    await cli.run(["setup"], createIo(stdout));
    expect(calls).toEqual(["setup"]);
    expect(JSON.parse(stdout.content)).toMatchObject({
      tasks: [
        {
          name: "cache",
          status: "completed",
        },
      ],
    });

    const customStdout = new MemoryWritable();
    await cli.run(["custom"], createIo(customStdout));
    expect(JSON.parse(customStdout.content)).toEqual({
      custom: true,
    });
  });
});

function createEchoCli(calls: string[] = []) {
  return createMcpCli({
    appName: "echo-app",
    commands: [
      {
        name: "custom",
        run: ({ io }) => writeJson(io.stdout, { custom: true }),
      },
    ],
    createApp: createEchoApp,
    setupTasks: [
      defineSetupTask({
        name: "cache",
        run: () => {
          calls.push("setup");
        },
      }),
    ],
  });
}

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

function createIo(stdout: MemoryWritable) {
  return {
    env: {},
    stderr: new MemoryWritable(),
    stdout,
  };
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

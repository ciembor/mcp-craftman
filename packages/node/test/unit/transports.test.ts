import { PassThrough, Writable } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import { createTestApp, defineTool } from "@mcp-craftman/core";

import { createLogger, startHttpServer, startStdioServer } from "../../src/index.js";

describe("@mcp-craftman/node transports", () => {
  it("starts an HTTP adapter that calls registered tools", async () => {
    const app = createEchoApp();
    const http = await startHttpServer(app, {
      port: 0,
    });

    try {
      const response = await fetch(`${http.url}/tools/echo_value`, {
        method: "POST",
        body: JSON.stringify({
          value: "TERYT",
        }),
      });

      await expect(response.json()).resolves.toEqual({
        structuredContent: {
          value: "TERYT",
        },
      });
    } finally {
      await http.close();
    }
  });

  it("starts a stdio adapter that handles JSON tool calls", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: string[] = [];
    output.on("data", (chunk) => {
      chunks.push(chunk.toString());
    });

    const stdio = startStdioServer(createEchoApp(), {
      input,
      output,
      logger: createLogger(new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      })),
    });

    input.write(`${JSON.stringify(createToolCallRequest())}\n`);

    await vi.waitFor(() => {
      expect(chunks.join("")).toContain('"SIMC"');
    });
    stdio.close();

    expect(JSON.parse(chunks.join(""))).toEqual({
      id: 1,
      result: {
        structuredContent: {
          value: "SIMC",
        },
      },
    });
  });
});

function createEchoApp() {
  return createTestApp([
    defineTool<{ value: string }, { value: string }>({
      name: "echo_value",
      policy: "read",
      outputSchema: {
        type: "object",
        properties: {
          value: {
            type: "string",
          },
        },
        required: ["value"],
      },
      returnsStructuredContent: true,
      annotations: {
        readOnlyHint: true,
      },
      handler: (input) => ({
        structuredContent: {
          value: input.value,
        },
      }),
    }),
  ]);
}

function createToolCallRequest() {
  return {
    id: 1,
    method: "tools/call",
    params: {
      name: "echo_value",
      input: {
        value: "SIMC",
      },
    },
  };
}

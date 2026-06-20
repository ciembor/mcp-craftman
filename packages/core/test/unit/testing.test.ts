import { describe, expect, it } from "vitest";

import { callTool, createCapabilityRegistry, createMcpApp, createTestApp, defineTool } from "../../src/index.js";

describe("@mcp-craftsman/core testing", () => {
  it("creates an MCP app from a valid registry", () => {
    const registry = createCapabilityRegistry([]);
    const app = createMcpApp({
      name: "teryt-mcp",
      version: "0.0.0",
      registry,
    });

    expect(app.name).toBe("teryt-mcp");
    expect(app.registry).toBe(registry);
  });

  it("calls registered tool handlers through the test helper", async () => {
    const app = createTestApp([
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

    await expect(callTool(app, "echo_value", { value: "TERYT" })).resolves.toEqual({
      structuredContent: {
        value: "TERYT",
      },
    });
  });
});

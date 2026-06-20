import { describe, expect, it } from "vitest";
import * as z from "zod";

import { callTool, createTestApp } from "@mcp-craftman/core";

import { defineZodTool } from "../../src/index.js";

describe("@mcp-craftman/zod defineZodTool", () => {
  it("creates JSON schemas from Zod schemas and infers handler input", async () => {
    const tool = defineZodTool({
      name: "echo_name",
      policy: "read",
      annotations: {
        readOnlyHint: true,
      },
      input: z.object({
        name: z.string().min(1),
      }),
      output: z.object({
        message: z.string(),
      }),
      handler: (input) => ({
        structuredContent: {
          message: input.name.toUpperCase(),
        },
      }),
    });

    expect(tool.kind).toBe("tool");
    expect(tool.returnsStructuredContent).toBe(true);
    expect(tool.inputSchema).toMatchObject({
      type: "object",
      properties: {
        name: {
          type: "string",
        },
      },
      required: ["name"],
    });
    expect(tool.outputSchema).toMatchObject({
      type: "object",
      properties: {
        message: {
          type: "string",
        },
      },
      required: ["message"],
    });

    await expect(callTool(createTestApp([tool]), "echo_name", { name: "ala" })).resolves.toEqual({
      structuredContent: {
        message: "ALA",
      },
    });
  });

  it("validates input and structured content at runtime", async () => {
    const tool = defineZodTool({
      name: "double",
      policy: "read",
      annotations: {
        readOnlyHint: true,
      },
      input: z.object({
        value: z.number(),
      }),
      output: z.object({
        value: z.number(),
      }),
      handler: (input) => ({
        structuredContent: {
          value: input.value * 2,
        },
      }),
    });

    await expect(callTool(createTestApp([tool]), "double", { value: "bad" })).rejects.toThrow("double received invalid input.");
  });
});

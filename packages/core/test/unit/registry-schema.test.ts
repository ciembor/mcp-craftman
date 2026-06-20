import { describe, expect, it } from "vitest";

import { assertMcpAnnotations, assertToolSchemas, createCapabilityRegistry, defineTool } from "../../src/index.js";

describe("@mcp-craftsman/core tool schema validation", () => {
  it("rejects structured tool results without an output schema", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "health_status",
          policy: "read",
          returnsStructuredContent: true,
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({
            structuredContent: {
              ok: true,
            },
          }),
        }),
      ]),
    ).toThrow(/outputSchema/);
  });

  it("rejects list and search tools without limit input", () => {
    expect(() => createCapabilityRegistry([createReadTool("list_places")])).toThrow(/limit/);
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "search_places",
          policy: "read",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
              },
            },
          },
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/limit/);
  });

});

describe("@mcp-craftsman/core annotation validation", () => {
  it("rejects inconsistent read and write annotations", () => {
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "read_status",
          policy: "read",
          annotations: {
            readOnlyHint: false,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/readOnlyHint/);
    expect(() =>
      createCapabilityRegistry([
        defineTool({
          name: "sync_data",
          policy: "write",
          annotations: {
            readOnlyHint: true,
          },
          handler: () => ({ content: [] }),
        }),
      ]),
    ).toThrow(/write-capable/);
  });

  it("exposes focused architecture assertions for registries", () => {
    const registry = createCapabilityRegistry([
      defineTool({
        name: "health_status",
        policy: "read",
        outputSchema: {
          type: "object",
        },
        returnsStructuredContent: true,
        annotations: {
          readOnlyHint: true,
        },
        handler: () => ({
          structuredContent: {
            ok: true,
          },
        }),
      }),
    ]);

    expect(() => assertMcpAnnotations(registry)).not.toThrow();
    expect(() => assertToolSchemas(registry)).not.toThrow();
  });
});

function createReadTool(name: string) {
  return defineTool({
    name,
    policy: "read",
    annotations: {
      readOnlyHint: true,
    },
    handler: () => ({ content: [] }),
  });
}

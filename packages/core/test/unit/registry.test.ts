import { describe, expect, it } from "vitest";

import {
  assertValidRegistry,
  createCapabilityRegistry,
  defineTool,
  validateRegistry,
  type CapabilityRegistry,
} from "../../src/index.js";

const limitInputSchema = {
  type: "object",
  properties: {
    limit: {
      type: "number",
      minimum: 1,
    },
  },
  required: ["limit"],
};

describe("@mcp-craftman/core registry", () => {
  it("defines and registers capabilities in deterministic order", () => {
    const registry = createCapabilityRegistry([
      defineTool({
        name: "list_places",
        policy: "read",
        inputSchema: limitInputSchema,
        annotations: {
          readOnlyHint: true,
        },
        handler: () => ({ content: [] }),
      }),
      defineTool({
        name: "health_status",
        policy: "read",
        annotations: {
          readOnlyHint: true,
        },
        handler: () => ({ content: [] }),
      }),
    ]);

    expect(registry.capabilities.map((capability) => capability.name)).toEqual(["health_status", "list_places"]);
    expect(registry.tools()).toHaveLength(2);
  });

  it("rejects duplicate names", () => {
    expect(() =>
      createCapabilityRegistry([
        createReadTool("health_status"),
        createReadTool("health_status"),
      ]),
    ).toThrow(/duplicated/);
  });

  it("rejects invalid naming convention", () => {
    expect(() => createCapabilityRegistry([createReadTool("HealthStatus")])).toThrow(/snake_case/);
  });

  it("rejects unsorted registries when asserted directly", () => {
    const registry: CapabilityRegistry = {
      capabilities: [createReadTool("z_tool"), createReadTool("a_tool")],
      get: () => undefined,
      tools: () => [],
    };

    expect(validateRegistry(registry)).toContain("Capability registry must be sorted deterministically by name.");
    expect(() => assertValidRegistry(registry)).toThrow(/sorted deterministically/);
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

export function createTestFiles() {
  return [
    {
      path: "test/architecture/project.architecture.test.ts",
      content: architectureTestTemplate,
    },
    {
      path: "test/contracts/health.contract.test.ts",
      content: healthContractTemplate,
    },
    {
      path: "test/contracts/public-capabilities.contract.test.ts",
      content: publicCapabilitiesContractTemplate,
    },
    {
      path: "test/integration/app.smoke.test.ts",
      content: appSmokeTestTemplate,
    },
  ];
}

const architectureTestTemplate = `import { describe, expect, it } from "vitest";

import { registry } from "../../src/mcp/registry.js";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    expect(registry.capabilities.map((capability) => capability.name)).toEqual(["health_status"]);
  });
});
`;

const healthContractTemplate = `import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";

describe("health contract", () => {
  it("returns structured health status", async () => {
    await expect(callTool(createApp(), "health_status", {})).resolves.toEqual({
      structuredContent: {
        ok: true,
      },
    });
  });
});
`;

const publicCapabilitiesContractTemplate = `import { describe, expect, it } from "vitest";

import { callTool, type Capability } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";

const publicToolInputs: Readonly<Record<string, unknown>> = {
  health_status: {},
};

describe("public capability contracts", () => {
  it("covers every public capability", () => {
    const app = createApp();

    expect(app.registry.capabilities.map((capability) => capability.name)).toEqual(Object.keys(publicToolInputs));
  });

  it("defines output schemas and consistent annotations", () => {
    const app = createApp();

    for (const tool of app.registry.tools()) {
      expect(tool.outputSchema, tool.name).toBeDefined();
      expect(tool.returnsStructuredContent, tool.name).toBe(true);
      expectAnnotations(tool);
    }
  });

  it("returns structured content for every public tool", async () => {
    const app = createApp();

    for (const [toolName, input] of Object.entries(publicToolInputs)) {
      const result = await callTool(app, toolName, input);

      expect(result, toolName).toHaveProperty("structuredContent");
      expect(result.structuredContent, toolName).toBeDefined();
    }
  });

  it("returns stable errors for invalid tool names", async () => {
    await expect(callTool(createApp(), "missing_tool", {})).rejects.toMatchObject({
      message: "Unknown tool: missing_tool.",
      name: "Error",
    });
  });
});

function expectAnnotations(tool: Capability): void {
  if (tool.policy === "read") {
    expect(tool.annotations, tool.name).toMatchObject({
      readOnlyHint: true,
    });
    return;
  }

  expect(tool.annotations, tool.name).toMatchObject({
    destructiveHint: false,
    readOnlyHint: false,
  });
}
`;

const appSmokeTestTemplate = `import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";

describe("app", () => {
  it("creates an MCP app", () => {
    const app = createApp();

    expect(app.registry.get("health_status")).toBeDefined();
  });
});
`;

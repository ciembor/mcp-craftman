export function createTestFiles() {
  return [
    {
      path: "test/architecture/project.architecture.test.ts",
      content: `import { describe, expect, it } from "vitest";

import { registry } from "../../src/mcp/registry.js";

describe("project architecture", () => {
  it("keeps the capability registry valid", () => {
    expect(registry.capabilities.map((capability) => capability.name)).toEqual(["health_status"]);
  });
});
`,
    },
    {
      path: "test/contracts/health.contract.test.ts",
      content: `import { describe, expect, it } from "vitest";

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
`,
    },
    {
      path: "test/integration/app.smoke.test.ts",
      content: `import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.js";

describe("app", () => {
  it("creates an MCP app", () => {
    const app = createApp();

    expect(app.registry.get("health_status")).toBeDefined();
  });
});
`,
    },
  ];
}

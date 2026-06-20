export function createSourceFiles(packageName: string) {
  return [
    {
      path: "src/app.ts",
      content: createAppTemplate(packageName),
    },
    {
      path: "src/main.ts",
      content: mainTemplate,
    },
    {
      path: "src/mcp/registry.ts",
      content: registryTemplate,
    },
    {
      path: "src/features/health/index.ts",
      content: healthIndexTemplate,
    },
    {
      path: "src/features/health/domain/health-status.ts",
      content: healthStatusTemplate,
    },
    {
      path: "src/features/health/application/get-health.ts",
      content: getHealthTemplate,
    },
    {
      path: "src/features/health/mcp/health.tool.ts",
      content: healthToolTemplate,
    },
  ];
}

function createAppTemplate(packageName: string): string {
  return `import { createMcpApp } from "@mcp-craftman/core";

import { registry } from "./mcp/registry.js";

export function createApp() {
  return createMcpApp({
    name: "${packageName}",
    version: "0.1.0",
    registry,
  });
}
`;
}

const mainTemplate = `import { serveMcpApp } from "@mcp-craftman/node";

import { createApp } from "./app.js";

await serveMcpApp(createApp);
`;

const registryTemplate = `import { createCapabilityRegistry } from "@mcp-craftman/core";

import { healthTool } from "../features/health/index.js";

export const registry = createCapabilityRegistry([
  healthTool,
]);
`;

const healthIndexTemplate = `export { getHealth } from "./application/get-health.js";
export { healthTool } from "./mcp/health.tool.js";
export type { HealthStatus } from "./domain/health-status.js";
`;

const healthStatusTemplate = `export type HealthStatus = {
  readonly ok: boolean;
};
`;

const getHealthTemplate = `import type { HealthStatus } from "../domain/health-status.js";

export function getHealth(): HealthStatus {
  return {
    ok: true,
  };
}
`;

const healthToolTemplate = `import { defineZodTool } from "@mcp-craftman/zod";
import * as z from "zod";

import { getHealth } from "../application/get-health.js";

export const healthTool = defineZodTool({
  name: "health_status",
  description: "Returns basic server health.",
  policy: "read",
  input: z.object({}),
  output: z.object({
    ok: z.boolean(),
  }),
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: getHealth(),
  }),
});
`;

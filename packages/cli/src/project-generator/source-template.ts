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
      path: "src/server/transports/http.ts",
      content: httpTransportTemplate,
    },
    {
      path: "src/server/transports/stdio.ts",
      content: stdioTransportTemplate,
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

const mainTemplate = `import { loadRuntimeConfig } from "@mcp-craftman/node";

import { createApp } from "./app.js";
import { startHttpTransport } from "./server/transports/http.js";
import { startStdioTransport } from "./server/transports/stdio.js";

const app = createApp();
const config = loadRuntimeConfig();

if (config.transport === "http") {
  await startHttpTransport(app, {
    port: config.port,
  });
} else {
  startStdioTransport(app);
}
`;

const registryTemplate = `import { createCapabilityRegistry } from "@mcp-craftman/core";

import { healthTool } from "../features/health/index.js";

export const registry = createCapabilityRegistry([
  healthTool,
]);
`;

const httpTransportTemplate = `import { startHttpServer, type HttpServerOptions } from "@mcp-craftman/node";
import type { McpApp } from "@mcp-craftman/core";

export function startHttpTransport(app: McpApp, options: HttpServerOptions = {}) {
  return startHttpServer(app, options);
}
`;

const stdioTransportTemplate = `import { startStdioServer, type StdioServerOptions } from "@mcp-craftman/node";
import type { McpApp } from "@mcp-craftman/core";

export function startStdioTransport(app: McpApp, options: StdioServerOptions = {}) {
  return startStdioServer(app, options);
}
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

const healthToolTemplate = `import { defineTool } from "@mcp-craftman/core";

import { getHealth } from "../application/get-health.js";

export const healthTool = defineTool({
  name: "health_status",
  description: "Returns basic server health.",
  policy: "read",
  returnsStructuredContent: true,
  outputSchema: {
    type: "object",
    properties: {
      ok: {
        type: "boolean",
      },
    },
    required: ["ok"],
  },
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: getHealth(),
  }),
});
`;

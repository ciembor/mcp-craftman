import type { Capability, McpApp } from "../capabilities/types.js";
import { createCapabilityRegistry, createMcpApp } from "../registry/capability-registry.js";

export function createTestApp(capabilities: readonly Capability[] = []): McpApp {
  return createMcpApp({
    name: "test-app",
    version: "0.0.0",
    registry: createCapabilityRegistry(capabilities),
  });
}

import type { Capability, CapabilityRegistry, McpApp, McpAppDefinition } from "../capabilities/types.js";
import { assertValidRegistry, sortCapabilities } from "./registry-validation.js";

export function createMcpApp(definition: McpAppDefinition): McpApp {
  assertValidRegistry(definition.registry);

  return {
    name: definition.name,
    version: definition.version,
    registry: definition.registry,
  };
}

export function createCapabilityRegistry(capabilities: readonly Capability[]): CapabilityRegistry {
  const sortedCapabilities = sortCapabilities(capabilities);
  const registry: CapabilityRegistry = {
    capabilities: sortedCapabilities,
    get: (name) => sortedCapabilities.find((capability) => capability.name === name),
    tools: () => sortedCapabilities,
  };

  assertValidRegistry(registry);

  return registry;
}

export function assertCapabilityRegistry(registry: CapabilityRegistry): void {
  assertValidRegistry(registry);
}

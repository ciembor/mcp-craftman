import type { Capability, CapabilityRegistry, JsonSchema } from "../capabilities/types.js";

export function assertValidRegistry(registry: CapabilityRegistry): void {
  const errors = validateRegistry(registry);

  if (errors.length > 0) {
    throw new Error(`Invalid capability registry:\n${formatErrorList(errors)}`);
  }
}

export function assertMcpAnnotations(registry: CapabilityRegistry): void {
  const errors = registry.capabilities.flatMap((capability) => {
    const capabilityErrors: string[] = [];
    validateAnnotations(capability, capabilityErrors);
    return capabilityErrors;
  });

  if (errors.length > 0) {
    throw new Error(`Invalid MCP annotations:\n${formatErrorList(errors)}`);
  }
}

export function assertToolSchemas(registry: CapabilityRegistry): void {
  const errors = registry.tools().flatMap((tool) => {
    const toolErrors: string[] = [];
    validateTool(tool, toolErrors);
    return toolErrors;
  });

  if (errors.length > 0) {
    throw new Error(`Invalid tool schemas:\n${formatErrorList(errors)}`);
  }
}

export function validateRegistry(registry: CapabilityRegistry): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();
  const expectedOrder = sortCapabilities(registry.capabilities);

  registry.capabilities.forEach((capability, index) => {
    if (seenNames.has(capability.name)) {
      errors.push(`Capability name "${capability.name}" is duplicated.`);
    }
    seenNames.add(capability.name);

    if (!isSnakeCaseCapabilityName(capability.name)) {
      errors.push(`Capability name "${capability.name}" must use snake_case.`);
    }

    if (capability !== expectedOrder[index]) {
      errors.push("Capability registry must be sorted deterministically by name.");
    }

    validateAnnotations(capability, errors);
    validateTool(capability, errors);
  });

  return errors;
}

export function sortCapabilities(capabilities: readonly Capability[]): readonly Capability[] {
  return [...capabilities].sort((left, right) => left.name.localeCompare(right.name));
}

export function formatErrorList(errors: readonly string[]): string {
  return errors.map((error) => `- ${error}`).join("\n");
}

function validateTool(tool: Capability, errors: string[]): void {
  if (tool.returnsStructuredContent === true && !tool.outputSchema) {
    errors.push(`Tool "${tool.name}" returns structuredContent and must define outputSchema.`);
  }

  if (tool.name.startsWith("list_") && !schemaHasLimit(tool.inputSchema)) {
    errors.push(`Tool "${tool.name}" must define a limit input.`);
  }

  if (tool.name.includes("search") && !schemaHasLimit(tool.inputSchema)) {
    errors.push(`Search tool "${tool.name}" must define a limit input.`);
  }
}

function validateAnnotations(capability: Capability, errors: string[]): void {
  if (capability.policy === "read" && capability.annotations?.readOnlyHint !== true) {
    errors.push(`Capability "${capability.name}" is read-only and must set annotations.readOnlyHint to true.`);
  }

  if (capability.policy === "read" && capability.annotations?.destructiveHint === true) {
    errors.push(`Capability "${capability.name}" is read-only and cannot set annotations.destructiveHint to true.`);
  }

  if (capability.policy === "write" && capability.annotations?.readOnlyHint === true) {
    errors.push(`Capability "${capability.name}" is write-capable and cannot set annotations.readOnlyHint to true.`);
  }
}

function schemaHasLimit(schema: JsonSchema | undefined): boolean {
  return Boolean(schema?.properties?.limit);
}

function isSnakeCaseCapabilityName(name: string): boolean {
  return name.split("_").every(isCapabilityNameSegment);
}

function isCapabilityNameSegment(segment: string): boolean {
  if (!segment || !isLowercaseLetter(segment[0])) {
    return false;
  }

  return [...segment].every((character) => isLowercaseLetter(character) || isDigit(character));
}

function isLowercaseLetter(character: string | undefined): boolean {
  return character !== undefined && character >= "a" && character <= "z";
}

function isDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

export type InputObject = Record<string, unknown>;

export type QueryLimitInput = {
  readonly limit?: number;
  readonly query: string;
};

export function requireObjectInput(input: unknown, toolName: string, requiredField?: string): InputObject {
  if (typeof input !== "object" || input === null) {
    throwRequiredFieldError(toolName, requiredField);
  }

  return input as InputObject;
}

export function readRequiredStringField(input: unknown, fieldName: string, toolName: string): string {
  const object = requireObjectInput(input, toolName, fieldName);
  const value = object[fieldName];

  if (typeof value !== "string") {
    throwRequiredFieldError(toolName, fieldName);
  }

  return value;
}

export function readOptionalNumberField(input: unknown, fieldName: string, toolName: string): number | undefined {
  const object = requireObjectInput(input, toolName);
  const value = object[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number") {
    throw new Error(`${toolName} ${fieldName} must be a number.`);
  }

  return value;
}

export function readQueryLimitInput(input: unknown, toolName: string): QueryLimitInput {
  const query = readRequiredStringField(input, "query", toolName);
  const limit = readOptionalNumberField(input, "limit", toolName);

  return limit === undefined ? { query } : { limit, query };
}

function throwRequiredFieldError(toolName: string, fieldName: string | undefined): never {
  if (fieldName) {
    throw new Error(`${toolName} requires ${fieldName}.`);
  }

  throw new Error(`${toolName} requires object input.`);
}

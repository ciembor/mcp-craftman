export type CapabilityKind = "tool";

export const mcpCraftsmanCoreVersion = "0.2.0";

export type CapabilityPolicy = "read" | "write";

export type JsonSchema = {
  readonly type?: string;
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
  readonly [key: string]: unknown;
};

export type McpAnnotations = {
  readonly readOnlyHint?: boolean;
  readonly destructiveHint?: boolean;
  readonly idempotentHint?: boolean;
  readonly openWorldHint?: boolean;
};

export type CapabilityBase = {
  readonly kind: CapabilityKind;
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly policy: CapabilityPolicy;
  readonly annotations?: McpAnnotations;
};

export type ToolCallContext = {
  readonly signal?: AbortSignal;
};

export type ToolCallResult<TStructuredContent = unknown> = {
  readonly content?: readonly unknown[];
  readonly structuredContent?: TStructuredContent;
};

export type ToolHandler<TInput = unknown, TStructuredContent = unknown> = (
  input: TInput,
  context: ToolCallContext,
) => ToolCallResult<TStructuredContent> | Promise<ToolCallResult<TStructuredContent>>;

export type ToolCapability<TInput = unknown, TStructuredContent = unknown> = CapabilityBase & {
  readonly kind: "tool";
  readonly inputSchema?: JsonSchema;
  readonly outputSchema?: JsonSchema;
  readonly returnsStructuredContent?: boolean;
  readonly handler: ToolHandler<TInput, TStructuredContent>;
};

export type Capability = ToolCapability<never, unknown>;

export type CapabilityRegistry = {
  readonly capabilities: readonly Capability[];
  readonly get: (name: string) => Capability | undefined;
  readonly tools: () => readonly Capability[];
};

export type McpApp = {
  readonly name: string;
  readonly version: string;
  readonly registry: CapabilityRegistry;
};

export type McpAppDefinition = {
  readonly name: string;
  readonly version: string;
  readonly registry: CapabilityRegistry;
};

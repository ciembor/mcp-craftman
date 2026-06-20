import { defineTool, type JsonSchema, type ToolCallContext, type ToolCallResult, type ToolCapability } from "@mcp-craftman/core";
import * as z from "zod";

export type ZodToolDefinition<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
> = Omit<ToolCapability<z.output<TInputSchema>, z.output<TOutputSchema>>, "handler" | "inputSchema" | "kind" | "outputSchema"> & {
  readonly handler: (
    input: z.output<TInputSchema>,
    context: ToolCallContext,
  ) => Promise<ToolCallResult<z.output<TOutputSchema>>> | ToolCallResult<z.output<TOutputSchema>>;
  readonly input: TInputSchema;
  readonly output: TOutputSchema;
};

export function defineZodTool<TInputSchema extends z.ZodType, TOutputSchema extends z.ZodType>(
  definition: ZodToolDefinition<TInputSchema, TOutputSchema>,
): ToolCapability<z.output<TInputSchema>, z.output<TOutputSchema>> {
  return defineTool({
    annotations: definition.annotations,
    description: definition.description,
    handler: async (input, context) => validateToolResult(await definition.handler(definition.input.parse(input), context), definition.output),
    inputSchema: toJsonSchema(definition.input),
    name: definition.name,
    outputSchema: toJsonSchema(definition.output),
    policy: definition.policy,
    returnsStructuredContent: definition.returnsStructuredContent ?? true,
    title: definition.title,
  });
}

function validateToolResult<TOutputSchema extends z.ZodType>(
  result: ToolCallResult<z.output<TOutputSchema>>,
  output: TOutputSchema,
): ToolCallResult<z.output<TOutputSchema>> {
  if (result.structuredContent === undefined) {
    return result;
  }

  return {
    ...result,
    structuredContent: output.parse(result.structuredContent),
  };
}

function toJsonSchema(schema: z.ZodType): JsonSchema {
  return z.toJSONSchema(schema) as JsonSchema;
}

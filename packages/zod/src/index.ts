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
    handler: async (input, context) => {
      const parsedInput = parseInput(definition.name, input, definition.input);
      const result = await definition.handler(parsedInput, context);

      return validateToolResult(definition.name, result, definition.output);
    },
    inputSchema: toJsonSchema(definition.input),
    name: definition.name,
    outputSchema: toJsonSchema(definition.output),
    policy: definition.policy,
    returnsStructuredContent: definition.returnsStructuredContent ?? true,
    title: definition.title,
  });
}

function parseInput<TInputSchema extends z.ZodType>(
  toolName: string,
  input: unknown,
  schema: TInputSchema,
): z.output<TInputSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new Error(`${toolName} received invalid input.`);
  }

  return result.data;
}

function validateToolResult<TOutputSchema extends z.ZodType>(
  toolName: string,
  result: ToolCallResult<z.output<TOutputSchema>>,
  output: TOutputSchema,
): ToolCallResult<z.output<TOutputSchema>> {
  if (result.structuredContent === undefined) {
    return result;
  }

  const parsedOutput = output.safeParse(result.structuredContent);

  if (!parsedOutput.success) {
    throw new Error(`${toolName} returned invalid structured content.`);
  }

  return {
    ...result,
    structuredContent: parsedOutput.data,
  };
}

function toJsonSchema(schema: z.ZodType): JsonSchema {
  return z.toJSONSchema(schema) as JsonSchema;
}

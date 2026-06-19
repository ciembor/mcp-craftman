import type { McpApp, ToolCallContext, ToolCallResult, ToolCapability } from "../capabilities/types.js";

export async function callTool<TInput = unknown, TStructuredContent = unknown>(
  app: McpApp,
  name: string,
  input: TInput,
  context: ToolCallContext = {},
): Promise<ToolCallResult<TStructuredContent>> {
  const capability = app.registry.get(name);

  if (!capability) {
    throw new Error(`Tool "${name}" is not registered.`);
  }

  const tool = capability as ToolCapability<TInput, TStructuredContent>;

  return tool.handler(input, context) as Promise<ToolCallResult<TStructuredContent>>;
}

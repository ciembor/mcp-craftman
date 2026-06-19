import type { ToolCapability } from "./types.js";

export function defineTool<TInput = unknown, TStructuredContent = unknown>(
  capability: Omit<ToolCapability<TInput, TStructuredContent>, "kind">,
): ToolCapability<TInput, TStructuredContent> {
  return {
    ...capability,
    kind: "tool",
  };
}

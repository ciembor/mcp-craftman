import { callTool, type McpApp } from "@mcp-craftman/core";

export type JsonRpcRequest = {
  readonly id?: string | number | null;
  readonly method?: string;
  readonly params?: {
    readonly name?: string;
    readonly input?: unknown;
  };
};

export async function routeJsonRpc(app: McpApp, request: JsonRpcRequest): Promise<unknown> {
  if (request.method !== "tools/call") {
    throw new Error(`Unsupported method: ${request.method ?? "<missing>"}`);
  }

  if (!request.params?.name) {
    throw new Error("Tool call requires params.name.");
  }

  return callTool(app, request.params.name, request.params.input);
}

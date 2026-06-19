import { createInterface } from "node:readline";
import { Readable, Writable } from "node:stream";

import type { McpApp } from "@mcp-craftman/core";

import { createLogger, serializeError, type Logger } from "../../logging/logger.js";
import { routeJsonRpc, type JsonRpcRequest } from "./json-rpc.js";

export type StdioServer = {
  readonly close: () => void;
};

export type StdioServerOptions = {
  readonly input?: Readable;
  readonly output?: Writable;
  readonly logger?: Logger;
};

export function startStdioServer(app: McpApp, options: StdioServerOptions = {}): StdioServer {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const logger = options.logger ?? createLogger();
  const lines = createInterface({
    input,
    terminal: false,
  });

  lines.on("line", (line) => {
    void handleStdioLine(app, line, output, logger);
  });

  return {
    close: () => {
      lines.close();
    },
  };
}

async function handleStdioLine(app: McpApp, line: string, output: Writable, logger: Logger): Promise<void> {
  try {
    const request = JSON.parse(line) as JsonRpcRequest;
    const result = await routeJsonRpc(app, request);

    output.write(`${JSON.stringify({ id: request.id ?? null, result })}\n`);
  } catch (error) {
    logger.error("stdio request failed", serializeError(error));
    output.write(`${JSON.stringify({ id: null, error: serializeError(error) })}\n`);
  }
}

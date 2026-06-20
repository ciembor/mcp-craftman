import type { McpApp } from "@mcp-craftman/core";

import { createLogger, type Logger } from "../logging/logger.js";
import { loadRuntimeConfig, type RuntimeConfig } from "../runtime/runtime-config.js";
import { startHttpServer, type HttpServerOptions, type StartedHttpServer } from "../transports/http/http-server.js";
import { startStdioServer, type StdioServer, type StdioServerOptions } from "../transports/stdio/stdio-server.js";

export type McpAppFactory<TConfig extends RuntimeConfig = RuntimeConfig> = (config: TConfig) => McpApp;

export type ServeMcpAppOptions<TConfig extends RuntimeConfig = RuntimeConfig> = {
  readonly config?: TConfig;
  readonly http?: Omit<HttpServerOptions, "port" | "logger">;
  readonly logger?: Logger;
  readonly stdio?: Omit<StdioServerOptions, "logger">;
};

export type StartedMcpServer = StartedHttpServer | StdioServer;

export async function serveMcpApp<TConfig extends RuntimeConfig = RuntimeConfig>(
  createApp: McpAppFactory<TConfig>,
  options: ServeMcpAppOptions<TConfig> = {},
): Promise<StartedMcpServer> {
  const config = options.config ?? (loadRuntimeConfig() as TConfig);
  const logger = options.logger ?? createLogger();
  const app = createApp(config);

  if (config.transport === "http") {
    return startHttpServer(app, {
      ...options.http,
      logger,
      port: config.port,
    });
  }

  return startStdioServer(app, {
    ...options.stdio,
    logger,
  });
}

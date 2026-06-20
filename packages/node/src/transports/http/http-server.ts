import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { callTool, type McpApp } from "@mcp-craftsman/core";

import { createLogger, serializeError, type Logger } from "../../logging/logger.js";
import { loadRuntimeConfig } from "../../runtime/runtime-config.js";
import { readJsonBody, sendJson } from "./json-body.js";

export type HttpServerOptions = {
  readonly port?: number;
  readonly hostname?: string;
  readonly logger?: Logger;
};

export type StartedHttpServer = {
  readonly server: Server;
  readonly port: number;
  readonly url: string;
  readonly close: () => Promise<void>;
};

export async function startHttpServer(app: McpApp, options: HttpServerOptions = {}): Promise<StartedHttpServer> {
  const logger = options.logger ?? createLogger();
  const hostname = options.hostname ?? "127.0.0.1";
  const configuredPort = options.port ?? loadRuntimeConfig().port;
  const server = createServer((request, response) => {
    void handleHttpRequest(app, request, response, logger);
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(configuredPort, hostname, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : configuredPort;

  return {
    server,
    port,
    url: `http://${hostname}:${port}`,
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      }),
  };
}

async function handleHttpRequest(
  app: McpApp,
  request: IncomingMessage,
  response: ServerResponse,
  logger: Logger,
): Promise<void> {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, {
        ok: true,
        name: app.name,
        version: app.version,
      });
      return;
    }

    if (request.method === "POST" && request.url?.startsWith("/tools/")) {
      const toolName = decodeURIComponent(request.url.slice("/tools/".length));
      const input = await readJsonBody(request);
      const result = await callTool(app, toolName, input);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, {
      error: "not_found",
    });
  } catch (error) {
    logger.error("http request failed", serializeError(error));
    sendJson(response, 500, {
      error: serializeError(error),
    });
  }
}

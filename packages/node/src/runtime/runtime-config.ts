import { resolveDataDir } from "./data-dir.js";

const defaultAppName = "mcp-craftman";

export type RuntimeConfig = {
  readonly transport: "stdio" | "http";
  readonly port: number;
  readonly dataDir: string;
};

export type LoadRuntimeConfigOptions = {
  readonly appName?: string;
  readonly env?: NodeJS.ProcessEnv;
};

export function loadRuntimeConfig(envOrOptions: NodeJS.ProcessEnv | LoadRuntimeConfigOptions = process.env): RuntimeConfig {
  const options = normalizeOptions(envOrOptions);
  const env = options.env;

  return {
    transport: env.MCP_TRANSPORT === "http" ? "http" : "stdio",
    port: parsePort(env.PORT ?? env.MCP_PORT),
    dataDir: resolveDataDir(options),
  };
}

function parsePort(value: string | undefined): number {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

function normalizeOptions(envOrOptions: NodeJS.ProcessEnv | LoadRuntimeConfigOptions): Required<LoadRuntimeConfigOptions> {
  if (isLoadRuntimeConfigOptions(envOrOptions)) {
    return {
      appName: envOrOptions.appName ?? defaultAppName,
      env: envOrOptions.env ?? process.env,
    };
  }

  return {
    appName: defaultAppName,
    env: envOrOptions,
  };
}

function isLoadRuntimeConfigOptions(value: NodeJS.ProcessEnv | LoadRuntimeConfigOptions): value is LoadRuntimeConfigOptions {
  return typeof value.appName === "string" || typeof value.env === "object";
}

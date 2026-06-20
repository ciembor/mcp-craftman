import { resolveConfigDir, resolveDataDir } from "./data-dir.js";

const defaultAppName = "mcp-craftman";
const logLevels = ["debug", "info", "warn", "error", "silent"] as const;

export type RuntimeLogLevel = (typeof logLevels)[number];

export type RuntimeConfig = {
  readonly transport: "stdio" | "http";
  readonly port: number;
  readonly dataDir: string;
  readonly configDir: string;
  readonly logLevel: RuntimeLogLevel;
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
    configDir: resolveConfigDir(options),
    logLevel: parseLogLevel(env.MCP_LOG_LEVEL),
  };
}

function parsePort(value: string | undefined): number {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

function parseLogLevel(value: string | undefined): RuntimeLogLevel {
  if (value === undefined || value === "") {
    return "info";
  }

  if (isRuntimeLogLevel(value)) {
    return value;
  }

  throw new Error(`Invalid log level: ${value}`);
}

function isRuntimeLogLevel(value: string): value is RuntimeLogLevel {
  return logLevels.includes(value as RuntimeLogLevel);
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

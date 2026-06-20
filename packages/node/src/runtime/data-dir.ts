import { homedir } from "node:os";
import { resolve } from "node:path";

const defaultAppName = "mcp-craftsman";

export type ResolveDataDirOptions = {
  readonly appName?: string;
  readonly env?: NodeJS.ProcessEnv;
};

export function resolveDataDir(envOrOptions: NodeJS.ProcessEnv | ResolveDataDirOptions = process.env): string {
  const options = normalizeOptions(envOrOptions);
  const env = options.env;
  const appName = options.appName ?? defaultAppName;

  if (env.MCP_DATA_DIR) {
    return resolve(env.MCP_DATA_DIR);
  }

  if (env.XDG_CACHE_HOME) {
    return resolve(env.XDG_CACHE_HOME, appName);
  }

  if (process.platform === "darwin") {
    return resolve(homedir(), "Library", "Caches", appName);
  }

  if (process.platform === "win32" && env.LOCALAPPDATA) {
    return resolve(env.LOCALAPPDATA, appName);
  }

  return resolve(homedir(), ".cache", appName);
}

export function resolveConfigDir(envOrOptions: NodeJS.ProcessEnv | ResolveDataDirOptions = process.env): string {
  const options = normalizeOptions(envOrOptions);
  const env = options.env;
  const appName = options.appName ?? defaultAppName;

  if (env.MCP_CONFIG_DIR) {
    return resolve(env.MCP_CONFIG_DIR);
  }

  if (env.XDG_CONFIG_HOME) {
    return resolve(env.XDG_CONFIG_HOME, appName);
  }

  if (process.platform === "darwin") {
    return resolve(homedir(), "Library", "Application Support", appName);
  }

  if (process.platform === "win32" && env.APPDATA) {
    return resolve(env.APPDATA, appName);
  }

  return resolve(homedir(), ".config", appName);
}

function normalizeOptions(envOrOptions: NodeJS.ProcessEnv | ResolveDataDirOptions): Required<ResolveDataDirOptions> {
  if (isResolveDataDirOptions(envOrOptions)) {
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

function isResolveDataDirOptions(value: NodeJS.ProcessEnv | ResolveDataDirOptions): value is ResolveDataDirOptions {
  return typeof value.appName === "string" || typeof value.env === "object";
}

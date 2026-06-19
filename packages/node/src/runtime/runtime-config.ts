import { resolveDataDir } from "./data-dir.js";

export type RuntimeConfig = {
  readonly transport: "stdio" | "http";
  readonly port: number;
  readonly dataDir: string;
};

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return {
    transport: env.MCP_TRANSPORT === "http" ? "http" : "stdio",
    port: parsePort(env.PORT ?? env.MCP_PORT),
    dataDir: resolveDataDir(env),
  };
}

function parsePort(value: string | undefined): number {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid port: ${value}`);
  }

  return port;
}

import { resolve } from "node:path";

export function resolveDataDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.MCP_DATA_DIR) {
    return resolve(env.MCP_DATA_DIR);
  }

  if (env.XDG_CACHE_HOME) {
    return resolve(env.XDG_CACHE_HOME, "mcp-craftman");
  }

  return resolve(process.cwd(), ".cache", "mcp-craftman");
}

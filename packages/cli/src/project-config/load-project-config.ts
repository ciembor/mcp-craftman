import { cosmiconfig } from "cosmiconfig";

export type ProjectConfig = Record<string, unknown>;

export type LoadProjectConfigOptions = {
  readonly cwd?: string;
};

export type ProjectConfigResult = {
  readonly config: ProjectConfig;
  readonly filepath?: string;
};

const projectConfigSearchPlaces = [
  "package.json",
  ".mcp-craftmanrc",
  ".mcp-craftmanrc.json",
  ".mcp-craftmanrc.yaml",
  ".mcp-craftmanrc.yml",
  ".mcp-craftmanrc.js",
  ".mcp-craftmanrc.ts",
  ".mcp-craftmanrc.mjs",
  ".mcp-craftmanrc.cjs",
  "mcp-craftman.config.js",
  "mcp-craftman.config.ts",
  "mcp-craftman.config.mjs",
  "mcp-craftman.config.cjs",
] as const;

export async function loadProjectConfig(options: LoadProjectConfigOptions = {}): Promise<ProjectConfigResult> {
  const explorer = cosmiconfig("mcp-craftman", {
    searchPlaces: [...projectConfigSearchPlaces],
  });
  const result = await explorer.search(options.cwd);

  if (!result || result.isEmpty === true) {
    return {
      config: {},
    };
  }

  return {
    config: assertProjectConfig(result.config),
    filepath: result.filepath,
  };
}

function assertProjectConfig(config: unknown): ProjectConfig {
  if (config === null || Array.isArray(config) || typeof config !== "object") {
    throw new Error("MCP Craftman project config must be an object.");
  }

  return config as ProjectConfig;
}

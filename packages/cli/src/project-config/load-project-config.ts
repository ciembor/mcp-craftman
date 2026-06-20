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
  ".mcp-craftsmanrc",
  ".mcp-craftsmanrc.json",
  ".mcp-craftsmanrc.yaml",
  ".mcp-craftsmanrc.yml",
  ".mcp-craftsmanrc.js",
  ".mcp-craftsmanrc.ts",
  ".mcp-craftsmanrc.mjs",
  ".mcp-craftsmanrc.cjs",
  "mcp-craftsman.config.js",
  "mcp-craftsman.config.ts",
  "mcp-craftsman.config.mjs",
  "mcp-craftsman.config.cjs",
] as const;

export async function loadProjectConfig(options: LoadProjectConfigOptions = {}): Promise<ProjectConfigResult> {
  const explorer = cosmiconfig("mcp-craftsman", {
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
    throw new Error("MCP Craftsman project config must be an object.");
  }

  return config as ProjectConfig;
}

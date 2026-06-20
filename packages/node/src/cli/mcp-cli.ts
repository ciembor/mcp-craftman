import { callTool, type McpApp } from "@mcp-craftsman/core";

import { loadRuntimeConfig, type RuntimeConfig } from "../runtime/runtime-config.js";
import { runSetupTasks, type SetupTask } from "../setup/setup-task.js";
import { serveMcpApp } from "../server/serve-mcp-app.js";
import { createDefaultCliIo, writeJson, type CliAppFactory, type CliIo } from "./cli-io.js";

export type McpCliCommandContext<TConfig extends RuntimeConfig = RuntimeConfig> = {
  readonly app: McpApp;
  readonly args: readonly string[];
  readonly config: TConfig;
  readonly io: CliIo;
};

export type McpCliCommand<TConfig extends RuntimeConfig = RuntimeConfig> = {
  readonly name: string;
  readonly run: (context: McpCliCommandContext<TConfig>) => Promise<void> | void;
};

export type McpCliOptions<TConfig extends RuntimeConfig = RuntimeConfig> = {
  readonly appName: string;
  readonly commands?: readonly McpCliCommand<TConfig>[];
  readonly createApp: CliAppFactory<TConfig>;
  readonly serve?: (createApp: CliAppFactory<TConfig>, config: TConfig) => Promise<unknown> | unknown;
  readonly setupTasks?: readonly SetupTask[];
};

export type McpCli = {
  readonly run: (argv?: readonly string[], io?: CliIo) => Promise<void>;
};

export function createMcpCli<TConfig extends RuntimeConfig = RuntimeConfig>(options: McpCliOptions<TConfig>): McpCli {
  return {
    run: (argv = process.argv.slice(2), io = createDefaultCliIo()) => runMcpCli(argv, io, options),
  };
}

async function runMcpCli<TConfig extends RuntimeConfig>(
  argv: readonly string[],
  io: CliIo,
  options: McpCliOptions<TConfig>,
): Promise<void> {
  const [command = "serve", ...args] = argv;
  const config = loadRuntimeConfig({
    appName: options.appName,
    env: io.env,
  }) as TConfig;
  const app = options.createApp(config);
  const customCommand = options.commands?.find((item) => item.name === command);

  if (customCommand) {
    await customCommand.run({
      app,
      args,
      config,
      io,
    });
    return;
  }

  await runStandardCommand(command, args, io, app, config, options);
}

async function runStandardCommand<TConfig extends RuntimeConfig>(
  command: string,
  args: readonly string[],
  io: CliIo,
  app: McpApp,
  config: TConfig,
  options: McpCliOptions<TConfig>,
): Promise<void> {
  if (command === "serve") {
    await (options.serve ?? serveMcpApp)(options.createApp, config);
    return;
  }

  if (command === "status") {
    writeJson(io.stdout, {
      appName: app.name,
      appVersion: app.version,
      dataDir: config.dataDir,
      port: config.port,
      transport: config.transport,
    });
    return;
  }

  await runDataCommand(command, args, io, app, options.setupTasks ?? []);
}

async function runDataCommand(
  command: string,
  args: readonly string[],
  io: CliIo,
  app: McpApp,
  setupTasks: readonly SetupTask[],
): Promise<void> {
  if (command === "tools") {
    writeJson(io.stdout, {
      tools: app.registry.tools().map((tool) => ({
        description: tool.description,
        name: tool.name,
        policy: tool.policy,
      })),
    });
    return;
  }

  if (command === "call") {
    const result = await callTool(app, readToolName(args), readToolInput(args));
    writeJson(io.stdout, result.structuredContent);
    return;
  }

  if (command === "setup") {
    writeJson(io.stdout, await runSetupTasks(setupTasks, { mode: args.includes("--force") ? "force" : "missing" }));
    return;
  }

  throw new Error(`Unknown command: ${command}.`);
}

function readToolName(args: readonly string[]): string {
  const toolName = args[0];

  if (!toolName) {
    throw new Error("call requires tool name.");
  }

  return toolName;
}

function readToolInput(args: readonly string[]): unknown {
  const rawInput = args[1];

  if (!rawInput) {
    return {};
  }

  return JSON.parse(rawInput) as unknown;
}

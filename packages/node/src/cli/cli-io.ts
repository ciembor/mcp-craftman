import { basename } from "node:path";

import { callTool, type McpApp, type ToolCallResult } from "@mcp-craftman/core";

import { loadRuntimeConfig, type RuntimeConfig } from "../runtime/runtime-config.js";

export type CliIo = {
  readonly env: NodeJS.ProcessEnv;
  readonly stderr: NodeJS.WritableStream;
  readonly stdout: NodeJS.WritableStream;
};

export type CliAppFactory<TConfig extends RuntimeConfig = RuntimeConfig> = (config: TConfig) => McpApp;

export function createDefaultCliIo(): CliIo {
  return {
    env: process.env,
    stderr: process.stderr,
    stdout: process.stdout,
  };
}

export function writeJson(stream: NodeJS.WritableStream, value: unknown): void {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function callToolForCli<TConfig extends RuntimeConfig = RuntimeConfig>(
  createApp: CliAppFactory<TConfig>,
  toolName: string,
  input: unknown,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ToolCallResult> {
  return callTool(createApp(loadRuntimeConfig(env) as TConfig), toolName, input);
}

export async function writeCliToolStructuredContent<TConfig extends RuntimeConfig = RuntimeConfig>(
  stream: NodeJS.WritableStream,
  createApp: CliAppFactory<TConfig>,
  toolName: string,
  input: unknown,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const result = await callToolForCli(createApp, toolName, input, env);

  writeJson(stream, result.structuredContent);
}

export function isCliEntrypoint(binName: string, argvPath: string | undefined = process.argv[1]): boolean {
  const entrypoint = argvPath ? basename(argvPath) : "";

  return entrypoint === binName || entrypoint === "cli.js";
}

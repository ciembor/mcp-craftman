import { spawn } from "node:child_process";

import { qualitySteps } from "./quality-steps.js";

export type QualityRunner = (command: string, args: readonly string[]) => Promise<void>;

export async function runQuality(runner: QualityRunner = runCommand): Promise<void> {
  for (const [command, args] of qualitySteps) {
    await runner(command, args);
  }
}

async function runCommand(command: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolveCommand, rejectCommand) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", rejectCommand);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveCommand();
        return;
      }

      rejectCommand(new Error(`${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

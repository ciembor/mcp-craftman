import { parseInitArgs, initProject } from "./commands/init-command.js";
import { generateFeature, parseGenerateArgs } from "./commands/generate-command.js";
import { runQuality } from "./commands/quality-command.js";

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const [command, ...args] = argv;

  if (command === "init") {
    await initProject(parseInitArgs(args));
    return;
  }

  if (command === "quality") {
    await runQuality();
    return;
  }

  if (command === "generate") {
    await generateFeature(parseGenerateArgs(args));
    return;
  }

  throw new Error(`Unknown command: ${command ?? "<missing>"}`);
}

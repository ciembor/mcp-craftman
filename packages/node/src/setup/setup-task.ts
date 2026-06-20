export type SetupMode = "missing" | "force";

export type SetupTask = {
  readonly name: string;
  readonly run: (context: SetupTaskContext) => Promise<void> | void;
  readonly shouldRun?: (context: SetupTaskContext) => Promise<boolean> | boolean;
};

export type SetupTaskContext = {
  readonly mode: SetupMode;
};

export type SetupTaskResult = {
  readonly name: string;
  readonly status: "completed" | "failed" | "skipped";
  readonly error?: unknown;
};

export type RunSetupTasksOptions = {
  readonly mode?: SetupMode;
};

export type RunSetupTasksResult = {
  readonly mode: SetupMode;
  readonly tasks: readonly SetupTaskResult[];
};

export type PostinstallSetupOptions = RunSetupTasksOptions & {
  readonly env?: NodeJS.ProcessEnv;
  readonly failOnError?: boolean;
  readonly stderr?: NodeJS.WritableStream;
  readonly skipEnvVar?: string;
};

const skipValues = new Set(["1", "true", "yes"]);

export function defineSetupTask(task: SetupTask): SetupTask {
  return task;
}

export async function runSetupTasks(
  tasks: readonly SetupTask[],
  options: RunSetupTasksOptions = {},
): Promise<RunSetupTasksResult> {
  const mode = options.mode ?? "missing";
  const results: SetupTaskResult[] = [];

  for (const task of tasks) {
    results.push(await runSetupTask(task, mode));
  }

  return {
    mode,
    tasks: results,
  };
}

export async function runPostinstallSetup(
  tasks: readonly SetupTask[],
  options: PostinstallSetupOptions = {},
): Promise<RunSetupTasksResult> {
  const env = options.env ?? process.env;
  const skipEnvVar = options.skipEnvVar ?? "MCP_SKIP_POSTINSTALL_SETUP";
  const stderr = options.stderr ?? process.stderr;

  if (skipValues.has((env[skipEnvVar] ?? "").toLowerCase())) {
    stderr.write("mcp-craftman setup: skipping postinstall setup.\n");
    return {
      mode: options.mode ?? "missing",
      tasks: tasks.map((task) => ({
        name: task.name,
        status: "skipped",
      })),
    };
  }

  const result = await runSetupTasks(tasks, options);
  const failed = result.tasks.filter((task) => task.status === "failed");

  for (const task of result.tasks) {
    stderr.write(`mcp-craftman setup: ${task.name} ${task.status}.\n`);
  }

  if (failed.length > 0 && options.failOnError) {
    throw new Error(`Postinstall setup failed: ${failed.map((task) => task.name).join(", ")}.`);
  }

  return result;
}

async function runSetupTask(task: SetupTask, mode: SetupMode): Promise<SetupTaskResult> {
  const context = { mode };

  try {
    if (mode !== "force" && task.shouldRun && !(await task.shouldRun(context))) {
      return {
        name: task.name,
        status: "skipped",
      };
    }

    await task.run(context);

    return {
      name: task.name,
      status: "completed",
    };
  } catch (error) {
    return {
      error,
      name: task.name,
      status: "failed",
    };
  }
}

import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { defineSetupTask, runPostinstallSetup, runSetupTasks } from "../../src/index.js";

describe("@mcp-craftman/node setup task execution", () => {
  it("runs setup tasks in missing mode when they should run", async () => {
    const calls: string[] = [];
    const task = defineSetupTask({
      name: "database",
      run: ({ mode }) => {
        calls.push(`run:${mode}`);
      },
      shouldRun: ({ mode }) => {
        calls.push(`should:${mode}`);
        return true;
      },
    });

    await expect(runSetupTasks([task])).resolves.toEqual({
      mode: "missing",
      tasks: [
        {
          name: "database",
          status: "completed",
        },
      ],
    });
    expect(calls).toEqual(["should:missing", "run:missing"]);
  });

  it("skips setup tasks in missing mode when they should not run", async () => {
    const calls: string[] = [];

    await expect(
      runSetupTasks([
        defineSetupTask({
          name: "database",
          run: () => {
            calls.push("run");
          },
          shouldRun: () => false,
        }),
      ]),
    ).resolves.toEqual({
      mode: "missing",
      tasks: [
        {
          name: "database",
          status: "skipped",
        },
      ],
    });
    expect(calls).toEqual([]);
  });

  it("forces setup tasks regardless of shouldRun", async () => {
    const calls: string[] = [];

    await runSetupTasks(
      [
        defineSetupTask({
          name: "database",
          run: () => {
            calls.push("run");
          },
          shouldRun: () => false,
        }),
      ],
      {
        mode: "force",
      },
    );

    expect(calls).toEqual(["run"]);
  });

});

describe("@mcp-craftman/node setup task failures", () => {
  it("captures task failures without throwing by default", async () => {
    const result = await runSetupTasks([
      defineSetupTask({
        name: "database",
        run: () => {
          throw new Error("download failed");
        },
      }),
    ]);

    expect(result.tasks).toMatchObject([
      {
        name: "database",
        status: "failed",
      },
    ]);
  });

});

describe("@mcp-craftman/node postinstall setup", () => {
  it("supports best-effort postinstall setup with env opt-out", async () => {
    const stderr = new MemoryWritable();

    await expect(
      runPostinstallSetup(
        [
          defineSetupTask({
            name: "database",
            run: () => undefined,
          }),
        ],
        {
          env: {
            MCP_SKIP_POSTINSTALL_SETUP: "1",
          },
          stderr,
        },
      ),
    ).resolves.toEqual({
      mode: "missing",
      tasks: [
        {
          name: "database",
          status: "skipped",
        },
      ],
    });
    expect(stderr.content).toContain("skipping postinstall setup");
  });
});

class MemoryWritable extends Writable {
  readonly chunks: string[] = [];

  get content(): string {
    return this.chunks.join("");
  }

  override _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString("utf8"));
    callback();
  }
}

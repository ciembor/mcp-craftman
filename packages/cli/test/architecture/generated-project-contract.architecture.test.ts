import { describe, expect, it } from "vitest";

import { createProjectFiles } from "../../src/index.js";

describe("@mcp-craftman/cli generated project contract", () => {
  it("generates the expected server shape", () => {
    expect(createProjectFiles("Example MCP").map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "src/app.ts",
        "src/main.ts",
        "src/mcp/registry.ts",
        "src/server/transports/http.ts",
        "src/server/transports/stdio.ts",
        "src/features/health/index.ts",
        "test/architecture/project.architecture.test.ts",
        "test/contracts/health.contract.test.ts",
        "test/integration/app.smoke.test.ts",
        "dependency-cruiser.config.cjs",
        "eslint.config.js",
        "knip.json",
        "vitest.config.ts",
      ]),
    );
  });
});

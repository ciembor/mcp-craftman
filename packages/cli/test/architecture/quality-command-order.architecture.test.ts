import { describe, expect, it } from "vitest";

import { getQualitySteps } from "../../src/index.js";

describe("@mcp-craftman/cli quality command order", () => {
  it("keeps generated quality checks aligned with the required order", () => {
    expect(getQualitySteps().map(([command, args]) => [command, ...args].join(" "))).toEqual([
      "knip",
      "tsc --noEmit",
      "eslint . --fix",
      "dependency-cruiser --config dependency-cruiser.config.cjs .",
      "vitest run test/architecture",
      "vitest run --coverage test/unit test/integration test/contracts",
    ]);
  });
});

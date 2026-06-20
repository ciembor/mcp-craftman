import { describe, expect, it } from "vitest";

import { assertCleanArchitectureLayers, assertFeatureBoundaries, assertNoDependencyCycles } from "../../src/index.js";

describe("@mcp-craftsman/core architecture", () => {
  it("detects dependency cycles between source files", () => {
    expect(() =>
      assertNoDependencyCycles([
        {
          path: "src/a.ts",
          content: 'import { b } from "./b";\nexport const a = b;',
        },
        {
          path: "src/b.ts",
          content: 'import { a } from "./a";\nexport const b = a;',
        },
      ]),
    ).toThrow(/Dependency cycles/);
  });

  it("detects clean architecture layer violations", () => {
    expect(() =>
      assertCleanArchitectureLayers([
        {
          path: "src/features/health/application/get-health.ts",
          content: 'import { healthTool } from "../mcp/health.tool";',
        },
        {
          path: "src/features/health/mcp/health.tool.ts",
          content: 'import { store } from "../infrastructure/store";',
        },
        {
          path: "src/features/health/domain/health.ts",
          content: 'import { Server } from "@modelcontextprotocol/sdk/server";',
        },
      ]),
    ).toThrow(/Clean architecture violations/);
  });

  it("detects cross-feature imports that skip index boundaries", () => {
    expect(() =>
      assertFeatureBoundaries([
        {
          path: "src/features/address/application/get-address.ts",
          content: 'import { getHealth } from "../../health/application/get-health";',
        },
      ]),
    ).toThrow(/Feature boundary violations/);
  });

  it("allows cross-feature imports through feature indexes", () => {
    expect(() =>
      assertFeatureBoundaries([
        {
          path: "src/features/address/application/get-address.ts",
          content: 'import { getHealth } from "src/features/health";',
        },
      ]),
    ).not.toThrow();
  });
});

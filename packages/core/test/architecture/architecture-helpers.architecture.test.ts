import { describe, expect, it } from "vitest";

import {
  assertCleanArchitectureLayers,
  assertFeatureBoundaries,
  assertNoDependencyCycles,
} from "../../src/index.js";

describe("@mcp-craftsman/core architecture helpers", () => {
  it("detects cycles and layer violations", () => {
    expect(() =>
      assertNoDependencyCycles([
        { path: "src/a.ts", content: 'import "./b";' },
        { path: "src/b.ts", content: 'import "./a";' },
      ]),
    ).toThrow(/Dependency cycles/);

    expect(() =>
      assertCleanArchitectureLayers([
        {
          path: "src/features/health/application/get-health.ts",
          content: 'import { store } from "../infrastructure/store";',
        },
      ]),
    ).toThrow(/Clean architecture violations/);
  });

  it("allows cross-feature imports only through feature indexes", () => {
    expect(() =>
      assertFeatureBoundaries([
        {
          path: "src/features/address/application/get-address.ts",
          content: 'import { getHealth } from "../../health/application/get-health";',
        },
      ]),
    ).toThrow(/Feature boundary violations/);
  });
});

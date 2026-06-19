import type { GeneratedFile } from "../project-generator/create-project-files.js";
import { createGeneratedNames } from "./name-style.js";

export function createFeatureFiles(name: string): readonly GeneratedFile[] {
  const names = createGeneratedNames(name);
  const root = `src/features/${names.featurePath}`;

  return [
    {
      path: `${root}/index.ts`,
      content: `export { ${names.functionName} } from "./application/${names.applicationFile}.js";
export { ${names.variableName} } from "./mcp/${names.applicationFile}.tool.js";
export type { ${names.resultType} } from "./domain/${names.resultFile}.js";
`,
    },
    {
      path: `${root}/domain/${names.resultFile}.ts`,
      content: `export type ${names.resultType} = {
  readonly message: string;
};
`,
    },
    {
      path: `${root}/application/${names.applicationFile}.ts`,
      content: `import type { ${names.resultType} } from "../domain/${names.resultFile}.js";

export function ${names.functionName}(): ${names.resultType} {
  return {
    message: "${names.toolName} ready",
  };
}
`,
    },
    {
      path: `${root}/mcp/${names.applicationFile}.tool.ts`,
      content: `import { defineTool } from "@mcp-craftman/core";

import { ${names.functionName} } from "../application/${names.applicationFile}.js";

export const ${names.variableName} = defineTool({
  name: "${names.toolName}",
  description: "Returns ${names.featurePath} status.",
  policy: "read",
  returnsStructuredContent: true,
  outputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
      },
    },
    required: ["message"],
  },
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: ${names.functionName}(),
  }),
});
`,
    },
    {
      path: `test/contracts/${names.featurePath}.contract.test.ts`,
      content: `import { describe, expect, it } from "vitest";

import { callTool } from "@mcp-craftman/core";

import { createApp } from "../../src/app.js";

describe("${names.toolName} contract", () => {
  it("returns structured content", async () => {
    await expect(callTool(createApp(), "${names.toolName}", {})).resolves.toEqual({
      structuredContent: {
        message: "${names.toolName} ready",
      },
    });
  });
});
`,
    },
  ];
}

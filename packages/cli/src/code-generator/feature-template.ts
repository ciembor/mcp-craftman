import type { GeneratedFile } from "../project-generator/create-project-files.js";
import { createGeneratedNames, type GeneratedNames } from "./name-style.js";

export function createFeatureFiles(name: string): readonly GeneratedFile[] {
  const names = createGeneratedNames(name);
  const root = `src/features/${names.featurePath}`;

  return [
    {
      path: `${root}/index.ts`,
      content: createIndexTemplate(names),
    },
    {
      path: `${root}/domain/${names.resultFile}.ts`,
      content: createDomainTemplate(names),
    },
    {
      path: `${root}/application/${names.applicationFile}.ts`,
      content: createApplicationTemplate(names),
    },
    {
      path: `${root}/application/ports/${names.applicationFile}-repository.ts`,
      content: createPortTemplate(names),
    },
    {
      path: `${root}/infrastructure/in-memory-${names.applicationFile}-repository.ts`,
      content: createInfrastructureTemplate(names),
    },
    {
      path: `${root}/mcp/${names.applicationFile}.tool.ts`,
      content: createToolTemplate(names),
    },
    {
      path: `test/contracts/${names.featurePath}.contract.test.ts`,
      content: createContractTemplate(names),
    },
  ];
}

function createIndexTemplate(names: GeneratedNames): string {
  return `export { ${names.functionName} } from "./application/${names.applicationFile}.js";
export { createInMemory${names.resultType}Repository } from "./infrastructure/in-memory-${names.applicationFile}-repository.js";
export { ${names.variableName} } from "./mcp/${names.applicationFile}.tool.js";
export type { ${names.resultType} } from "./domain/${names.resultFile}.js";
export type { ${names.resultType}Repository } from "./application/ports/${names.applicationFile}-repository.js";
`;
}

function createDomainTemplate(names: GeneratedNames): string {
  return `export type ${names.resultType} = {
  readonly message: string;
};
`;
}

function createApplicationTemplate(names: GeneratedNames): string {
  return `import type { ${names.resultType} } from "../domain/${names.resultFile}.js";
import type { ${names.resultType}Repository } from "./ports/${names.applicationFile}-repository.js";

export function ${names.functionName}(repository: ${names.resultType}Repository): ${names.resultType} {
  return repository.get${names.resultType}();
}
`;
}

function createPortTemplate(names: GeneratedNames): string {
  return `import type { ${names.resultType} } from "../../domain/${names.resultFile}.js";

export type ${names.resultType}Repository = {
  readonly get${names.resultType}: () => ${names.resultType};
};
`;
}

function createInfrastructureTemplate(names: GeneratedNames): string {
  return `import type { ${names.resultType} } from "../domain/${names.resultFile}.js";
import type { ${names.resultType}Repository } from "../application/ports/${names.applicationFile}-repository.js";

export function createInMemory${names.resultType}Repository(): ${names.resultType}Repository {
  return {
    get${names.resultType}: () => ({
      message: "${names.toolName} ready",
    }),
  };
}
`;
}

function createToolTemplate(names: GeneratedNames): string {
  return `import { defineZodTool } from "@mcp-craftman/zod";
import * as z from "zod";

import { ${names.functionName} } from "../application/${names.applicationFile}.js";
import { createInMemory${names.resultType}Repository } from "../infrastructure/in-memory-${names.applicationFile}-repository.js";

const repository = createInMemory${names.resultType}Repository();

export const ${names.variableName} = defineZodTool({
  name: "${names.toolName}",
  description: "Returns ${names.featurePath} status.",
  policy: "read",
  input: z.object({}),
  output: z.object({
    message: z.string(),
  }),
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: ${names.functionName}(repository),
  }),
});
`;
}

function createContractTemplate(names: GeneratedNames): string {
  return `import { describe, expect, it } from "vitest";

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
`;
}

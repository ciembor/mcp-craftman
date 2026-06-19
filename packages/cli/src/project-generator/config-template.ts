export function createConfigFiles() {
  return [
    {
      path: "tsconfig.json",
      content: tsconfigTemplate,
    },
    {
      path: "dependency-cruiser.config.cjs",
      content: dependencyCruiserTemplate,
    },
    {
      path: "eslint.config.js",
      content: eslintTemplate,
    },
    {
      path: "knip.json",
      content: knipTemplate,
    },
    {
      path: "vitest.config.ts",
      content: vitestTemplate,
    },
  ];
}

const tsconfigTemplate = `{
  "extends": "../../tsconfig.base.json",
  "include": [
    "src",
    "test"
  ]
}
`;

const dependencyCruiserTemplate = `module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
  },
};
`;

const eslintTemplate = `import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  {
    ignores: ["**/dist/**"],
  },
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {},
  },
);
`;

const knipTemplate = `{
  "entry": [
    "src/main.ts",
    "test/**/*.ts"
  ],
  "project": [
    "src/**/*.ts",
    "test/**/*.ts"
  ],
  "ignoreDependencies": [
    "@mcp-craftman/core",
    "@mcp-craftman/node",
    "dependency-cruiser"
  ],
  "ignoreIssues": {
    "src/features/**/index.ts": [
      "exports",
      "types"
    ]
  }
}
`;

const vitestTemplate = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text"],
    },
  },
});
`;

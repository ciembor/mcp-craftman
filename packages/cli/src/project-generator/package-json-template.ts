const frameworkVersion = "^0.1.1";
const cliVersion = "^0.1.2";

export function createPackageJson(packageName: string): string {
  return `${JSON.stringify(
    {
      name: packageName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        build: "tsup src/main.ts --format esm --dts",
        quality: "mcp-craftman quality",
        test: "vitest run",
      },
      dependencies: {
        "@mcp-craftman/core": frameworkVersion,
        "@mcp-craftman/node": frameworkVersion,
      },
      devDependencies: {
        "@mcp-craftman/cli": cliVersion,
        "@types/node": "^24.0.3",
        "@vitest/coverage-v8": "^3.2.4",
        "dependency-cruiser": "^13.1.5",
        eslint: "^9.29.0",
        "eslint-plugin-sonarjs": "^3.0.3",
        knip: "^5.61.3",
        tsup: "^8.5.0",
        "typescript-eslint": "^8.34.1",
        typescript: "^5.8.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

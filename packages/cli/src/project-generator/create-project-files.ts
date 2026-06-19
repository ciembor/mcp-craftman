import { createConfigFiles } from "./config-template.js";
import { createPackageJson } from "./package-json-template.js";
import { createSourceFiles } from "./source-template.js";
import { createTestFiles } from "./test-template.js";

export type GeneratedFile = {
  readonly path: string;
  readonly content: string;
};

export function createProjectFiles(name: string): readonly GeneratedFile[] {
  const packageName = normalizePackageName(name);

  return [
    {
      path: "package.json",
      content: createPackageJson(packageName),
    },
    ...createConfigFiles(),
    ...createSourceFiles(packageName),
    ...createTestFiles(),
  ];
}

function normalizePackageName(name: string): string {
  return name.trim().toLowerCase().replaceAll(/[^a-z0-9-]+/g, "-").replaceAll(/^-|-$/g, "");
}

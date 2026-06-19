export const qualitySteps: readonly [string, readonly string[]][] = [
  ["knip", []],
  ["tsc", ["--noEmit"]],
  ["eslint", [".", "--fix"]],
  ["dependency-cruiser", ["--config", "dependency-cruiser.config.cjs", "."]],
  ["vitest", ["run", "test/architecture"]],
  ["vitest", ["run", "--coverage", "test/unit", "test/integration", "test/contracts"]],
];

export function getQualitySteps(): readonly [string, readonly string[]][] {
  return qualitySteps;
}

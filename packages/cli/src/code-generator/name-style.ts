export type GeneratedNames = {
  readonly applicationFile: string;
  readonly functionName: string;
  readonly resultFile: string;
  readonly resultType: string;
  readonly toolName: string;
  readonly variableName: string;
  readonly featurePath: string;
};

export function createGeneratedNames(name: string): GeneratedNames {
  const words = name
    .trim()
    .split(/[^a-zA-Z0-9]+/u)
    .map((word) => word.toLowerCase())
    .filter(Boolean);

  if (words.length === 0) {
    throw new Error("Feature name must contain at least one letter or number.");
  }

  const featurePath = words.join("-");
  const pascalName = words.map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join("");
  const camelName = `${words[0] ?? ""}${pascalName.slice(words[0]?.length ?? 0)}`;

  return {
    applicationFile: featurePath,
    functionName: camelName,
    resultFile: `${featurePath}-result`,
    resultType: `${pascalName}Result`,
    toolName: words.join("_"),
    variableName: `${camelName}Tool`,
    featurePath,
  };
}

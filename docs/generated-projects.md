# Generated Projects

`mcp-craftman init <path> --name <name>` creates a complete MCP server project.

The `mcp-craftman` binary currently has these commands:

```text
init
generate feature
quality
```

Additional exports from `@mcp-craftman/cli` are library helpers, not terminal commands.

## Layout

```text
src/
  app.ts
  main.ts
  mcp/
    registry.ts
  server/
    transports/
      http.ts
      stdio.ts
  features/
    health/
      index.ts
      application/
      domain/
      mcp/
test/
  architecture/
  contracts/
  integration/
dependency-cruiser.config.cjs
eslint.config.js
knip.json
package.json
tsconfig.json
vitest.config.ts
```

The generated server starts with one read-only `health_status` tool.

## Feature Shape

Use this structure for features with external dependencies:

```text
src/features/<feature>/
  index.ts
  domain/
  application/
  application/ports/
  infrastructure/
  mcp/
```

Rules:

- domain types do not import runtime or MCP code;
- application code imports domain and local ports;
- infrastructure implements ports;
- MCP adapters define schemas and call application use cases;
- other code imports a feature through its `index.ts`.

## Runtime

Generated projects support stdio by default:

```bash
pnpm build
node dist/main.js
```

HTTP transport:

```bash
MCP_TRANSPORT=http PORT=3000 node dist/main.js
```

HTTP endpoints:

```text
GET /health
POST /tools/:toolName
```

## Quality

Generated projects use:

```bash
pnpm quality
```

The script runs `mcp-craftman quality`, which executes:

```text
knip
tsc --noEmit
eslint . --fix
dependency-cruiser --config dependency-cruiser.config.cjs .
vitest run test/architecture
vitest run --coverage test/unit test/integration test/contracts
```

## Programmatic API

`@mcp-craftman/cli` also exports:

```text
main
generateFeature
initProject
parseGenerateArgs
parseInitArgs
runQuality
getQualitySteps
createFeatureFiles
createGeneratedNames
updateRegistrySource
createProjectFiles
installPreCommitHook
findGitRoot
```

Use these from tests or custom tooling when you need the same behavior without shelling out to the binary.

## Generate A Feature

Inside an existing generated server:

```bash
mcp-craftman generate feature source-status
```

From another working directory:

```bash
mcp-craftman generate feature source-status --path ./my-server
```

The command creates:

```text
src/features/source-status/index.ts
src/features/source-status/domain/source-status-result.ts
src/features/source-status/application/source-status.ts
src/features/source-status/mcp/source-status.tool.ts
test/contracts/source-status.contract.test.ts
```

It refuses to overwrite existing files. By default it also updates `src/mcp/registry.ts` by adding the feature import and tool entry through a TypeScript AST-based edit.

Skip registry edits when you want to wire the tool manually:

```bash
mcp-craftman generate feature source-status --no-register
```

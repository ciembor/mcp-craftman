# Generated Projects

`mcp-craftsman init <path> --name <name>` creates a complete MCP server project.

The `mcp-craftsman` binary currently has these commands:

```text
init
generate feature
quality
```

Additional exports from `@mcp-craftsman/cli` are library helpers, not terminal commands.

## Layout

```text
src/
  app.ts
  main.ts
  mcp/
    registry.ts
  features/
    health/
      index.ts
      domain/
        health-status.ts
      application/
        get-health.ts
      mcp/
        health.tool.ts
test/
  architecture/
    project.architecture.test.ts
  contracts/
    health.contract.test.ts
    public-capabilities.contract.test.ts
  integration/
    app.smoke.test.ts
dependency-cruiser.config.cjs
eslint.config.js
knip.json
package.json
tsconfig.json
vitest.config.ts
```

The generated server starts with one read-only `health_status` tool implemented
with `@mcp-craftsman/zod`.

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

The POST body is the tool input. The response is the MCP tool result.

## Quality

Generated projects use:

```bash
pnpm quality
```

The script runs `mcp-craftsman quality`, which executes:

```text
knip
tsc --noEmit
eslint . --fix
dependency-cruiser --config dependency-cruiser.config.cjs .
vitest run test/architecture
vitest run --coverage test/unit test/integration test/contracts
```

## Programmatic API

`@mcp-craftsman/cli` also exports:

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
mcp-craftsman generate feature source-status
```

From another working directory:

```bash
mcp-craftsman generate feature source-status --path ./my-server
```

The command creates:

```text
src/features/source-status/index.ts
src/features/source-status/domain/source-status-result.ts
src/features/source-status/application/source-status.ts
src/features/source-status/application/ports/source-status-repository.ts
src/features/source-status/infrastructure/in-memory-source-status-repository.ts
src/features/source-status/mcp/source-status.tool.ts
test/contracts/source-status.contract.test.ts
```

The generated feature returns `{ message: "source_status ready" }` until you
replace the domain model, use case, repository, adapter, schema, and contract
test with real behavior.

It refuses to overwrite existing files. By default it also updates
`src/mcp/registry.ts` by adding the feature import and tool entry through a
TypeScript AST-based edit.

Skip registry edits when you want to wire the tool manually:

```bash
mcp-craftsman generate feature source-status --no-register
```

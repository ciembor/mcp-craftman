# Generated Projects

`mcp-craftman init <path> --name <name>` creates a complete MCP server project.

The `mcp-craftman` binary currently has two commands:

```text
init
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
initProject
parseInitArgs
runQuality
getQualitySteps
createProjectFiles
installPreCommitHook
findGitRoot
```

Use these from tests or custom tooling when you need the same behavior without shelling out to the binary.

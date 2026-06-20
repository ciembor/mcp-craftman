# Architecture

MCP Craftsman is a four-package workspace. Each package has one public root export and keeps implementation files private.

## Dependency Direction

```text
@mcp-craftsman/core
  <- @mcp-craftsman/node
  <- @mcp-craftsman/zod
  <- @mcp-craftsman/cli
```

`core` must remain runtime-independent. It cannot import Node.js filesystem, HTTP, process, or server-specific code.

`node` may depend on `core`, but it must not depend on `cli` or generated server code.

`zod` may depend on `core` because it adapts Zod schemas to core tool capabilities.

`cli` may depend on `core` and `node` because it generates server projects and runs quality checks.

## Public API

Public imports:

```text
@mcp-craftsman/core
@mcp-craftsman/node
@mcp-craftsman/zod
@mcp-craftsman/cli
```

Private imports:

```text
@mcp-craftsman/core/src/...
@mcp-craftsman/node/src/...
@mcp-craftsman/zod/src/...
@mcp-craftsman/cli/src/...
```

Consumers should never use private imports. Anything needed by generated projects or real servers must be exported intentionally from the package root.

## Core

`@mcp-craftsman/core` owns:

- `defineTool`;
- `createCapabilityRegistry`;
- `createMcpApp`;
- `callTool`;
- registry validation;
- capability, schema, annotation, and app types;
- architecture helper functions.

It should be usable in tests, browsers, workers, and Node.js without runtime adapters.

## Node

`@mcp-craftsman/node` owns:

- stdio transport;
- HTTP transport;
- environment-based runtime config;
- logger creation;
- atomic writes;
- lock files.

Transport code should route requests to `callTool`; it should not contain domain logic.

## Zod

`@mcp-craftsman/zod` owns:

- `defineZodTool`;
- input parsing through Zod;
- structured output validation through Zod;
- JSON Schema export through `z.toJSONSchema`.

It should remain a thin adapter over `core`, not a second tool model.

## CLI

`@mcp-craftsman/cli` owns:

- project generation;
- pre-commit hook installation;
- quality command orchestration.

Generated projects are examples of the intended architecture, not hidden dependencies of the framework.

## Enforcement

Quality checks include:

- TypeScript type checks for each package;
- ESLint with code-smell rules;
- dependency-cruiser boundaries and cycle checks;
- architecture tests under each package;
- unit tests with coverage.

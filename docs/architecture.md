# Architecture

MCP Craftman is a three-package workspace. Each package has one public root export and keeps implementation files private.

## Dependency Direction

```text
@mcp-craftman/core
  <- @mcp-craftman/node
  <- @mcp-craftman/cli
```

`core` must remain runtime-independent. It cannot import Node.js filesystem, HTTP, process, or server-specific code.

`node` may depend on `core`, but it must not depend on `cli` or generated server code.

`cli` may depend on `core` and `node` because it generates server projects and runs quality checks.

## Public API

Public imports:

```text
@mcp-craftman/core
@mcp-craftman/node
@mcp-craftman/cli
```

Private imports:

```text
@mcp-craftman/core/src/...
@mcp-craftman/node/src/...
@mcp-craftman/cli/src/...
```

Consumers should never use private imports. Anything needed by generated projects or real servers must be exported intentionally from the package root.

## Core

`@mcp-craftman/core` owns:

- `defineTool`;
- `createCapabilityRegistry`;
- `createMcpApp`;
- `callTool`;
- registry validation;
- capability, schema, annotation, and app types;
- architecture helper functions.

It should be usable in tests, browsers, workers, and Node.js without runtime adapters.

## Node

`@mcp-craftman/node` owns:

- stdio transport;
- HTTP transport;
- environment-based runtime config;
- logger creation;
- atomic writes;
- lock files.

Transport code should route requests to `callTool`; it should not contain domain logic.

## CLI

`@mcp-craftman/cli` owns:

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

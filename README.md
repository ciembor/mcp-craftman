# MCP Craftman

Small TypeScript framework for building MCP servers with explicit capabilities, reusable Node.js transports, and project quality tooling.

Published packages:

- `@mcp-craftman/core`
- `@mcp-craftman/node`
- `@mcp-craftman/cli`

Current release: `@mcp-craftman/core@0.1.1`, `@mcp-craftman/node@0.1.1`, and `@mcp-craftman/cli@0.1.2`.

## Packages

`@mcp-craftman/core`

- runtime-independent MCP app primitives;
- capability and tool definitions;
- capability registry validation;
- direct `callTool` helper for tests and CLIs;
- architecture helper functions used by generated projects.

`@mcp-craftman/node`

- stdio transport;
- HTTP transport;
- runtime config from environment variables;
- stderr-safe logger;
- atomic write and lock-file helpers.

`@mcp-craftman/cli`

- `mcp-craftman init`;
- `mcp-craftman generate feature`;
- `mcp-craftman quality`;
- generated project templates;
- quality command orchestration.

The CLI binary exposes a small set of terminal commands. The package also exports helper APIs for tests, tooling, and custom project generators.

## Requirements

- Node.js `>=20.19.0`
- pnpm `10.x`

## Install

For a server project:

```bash
pnpm add @mcp-craftman/core @mcp-craftman/node
pnpm add -D @mcp-craftman/cli
```

## Generate A Server

```bash
pnpm dlx @mcp-craftman/cli init ./my-server --name my-server
cd my-server
pnpm install
pnpm quality
```

The generated project starts with a `health_status` tool and quality configuration.

## CLI Commands

```bash
mcp-craftman init <path> --name <name>
mcp-craftman generate feature <name> [--path <path>]
mcp-craftman quality
```

`init` writes a new server project and installs the generated pre-commit hook.

`generate feature` writes a read-only feature skeleton into an existing server project.

`quality` runs the standard generated-project quality pipeline.

## CLI Package API

These are importable from `@mcp-craftman/cli`:

```ts
import {
  createFeatureFiles,
  createProjectFiles,
  findGitRoot,
  generateFeature,
  getQualitySteps,
  initProject,
  installPreCommitHook,
  main,
  parseInitArgs,
  parseGenerateArgs,
  runQuality,
} from "@mcp-craftman/cli";
```

They are not separate terminal commands; they are public helpers for tests, wrappers, and automation.

## Minimal App

```ts
import { createCapabilityRegistry, createMcpApp, defineTool } from "@mcp-craftman/core";

const healthTool = defineTool({
  name: "health_status",
  policy: "read",
  returnsStructuredContent: true,
  outputSchema: {
    type: "object",
    properties: {
      status: { type: "string" },
    },
    required: ["status"],
  },
  annotations: {
    readOnlyHint: true,
  },
  handler: () => ({
    structuredContent: {
      status: "ok",
    },
  }),
});

export const app = createMcpApp({
  name: "example-mcp",
  version: "0.1.0",
  registry: createCapabilityRegistry([healthTool]),
});
```

## Development

```bash
pnpm install
pnpm quality
pnpm build
```

Release validation:

```bash
pnpm release:framework
```

## Documentation

- [docs/architecture.md](docs/architecture.md) - package boundaries and dependency direction.
- [docs/generated-projects.md](docs/generated-projects.md) - generated server layout and CLI behavior.
- [docs/quality-and-release.md](docs/quality-and-release.md) - local gates and npm release workflow.

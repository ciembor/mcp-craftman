# MCP Craftsman

TypeScript framework for building small MCP servers with explicit tool contracts,
Node.js transports, generated project structure, and a repeatable quality gate.

Published packages:

- `@mcp-craftsman/core`
- `@mcp-craftsman/node`
- `@mcp-craftsman/zod`
- `@mcp-craftsman/cli`

Current release: `0.2.0`.

## What It Gives You

MCP Craftsman is intentionally narrow. It does not hide your application behind a
large framework. It gives you a stable way to define tools, compose them into an
app, serve the app over stdio or HTTP, and keep generated projects consistent.

Use it when you want:

- explicit MCP tools with input and output schemas;
- structured tool results that are easy to test;
- stdio transport for MCP clients;
- a simple HTTP adapter for local testing and service wrappers;
- a generated feature layout with domain, application, infrastructure, MCP, and
  contract-test files;
- a single `mcp-craftsman quality` command for generated projects.

## Install

For an existing TypeScript server:

```bash
pnpm add @mcp-craftsman/core @mcp-craftsman/node @mcp-craftsman/zod zod
pnpm add -D @mcp-craftsman/cli
```

Requirements:

- Node.js `>=20.19.0`
- pnpm `10.x`
- TypeScript ESM project (`"type": "module"`)

## Generate A Server

Create a new server project:

```bash
pnpm dlx @mcp-craftsman/cli init ./my-server --name my-server
cd my-server
pnpm install
pnpm quality
pnpm build
```

The generated project contains one working tool, `health_status`, and the files
needed to run and test it:

```text
src/app.ts
src/main.ts
src/mcp/registry.ts
src/features/health/domain/health-status.ts
src/features/health/application/get-health.ts
src/features/health/mcp/health.tool.ts
src/features/health/index.ts
test/architecture/project.architecture.test.ts
test/contracts/health.contract.test.ts
test/contracts/public-capabilities.contract.test.ts
test/integration/app.smoke.test.ts
dependency-cruiser.config.cjs
eslint.config.js
knip.json
tsconfig.json
vitest.config.ts
```

Generated scripts:

```json
{
  "build": "tsup src/main.ts --format esm --dts",
  "quality": "mcp-craftsman quality",
  "test": "vitest run"
}
```

The generated app is intentionally small:

- `src/app.ts` creates the MCP app;
- `src/main.ts` serves it;
- `src/mcp/registry.ts` is the explicit list of public capabilities;
- each feature owns its domain, use case, adapter, MCP tool, and tests.

## Run The Server

Build and run the default stdio transport:

```bash
pnpm build
node dist/main.js
```

Run HTTP transport:

```bash
MCP_TRANSPORT=http PORT=3000 node dist/main.js
```

Runtime environment:

```text
MCP_TRANSPORT=stdio|http  # default: stdio
MCP_PORT / PORT           # default: 3000
MCP_DATA_DIR              # default: cache dir for the app name
MCP_CONFIG_DIR            # default: config dir for the app name
MCP_LOG_LEVEL             # debug|info|warn|error|silent, default: info
```

HTTP endpoints:

```text
GET  /health
POST /tools/:toolName
```

The HTTP request body is the tool input. The response is the MCP tool result:

```bash
curl -s http://127.0.0.1:3000/tools/health_status \
  -H 'content-type: application/json' \
  -d '{}'
```

```json
{
  "structuredContent": {
    "ok": true
  }
}
```

The stdio adapter accepts JSON lines with `method: "tools/call"`:

```json
{"method":"tools/call","params":{"name":"health_status","input":{}}}
```

## Add A Feature

Generate a read-only feature skeleton:

```bash
mcp-craftsman generate feature source-status
```

Or target another project path:

```bash
mcp-craftsman generate feature source-status --path ./my-server
```

Skip automatic registry modification:

```bash
mcp-craftsman generate feature source-status --no-register
```

For `source-status`, the generator writes:

```text
src/features/source-status/index.ts
src/features/source-status/domain/source-status-result.ts
src/features/source-status/application/source-status.ts
src/features/source-status/application/ports/source-status-repository.ts
src/features/source-status/infrastructure/in-memory-source-status-repository.ts
src/features/source-status/mcp/source-status.tool.ts
test/contracts/source-status.contract.test.ts
```

By default it also updates `src/mcp/registry.ts`.

Generated feature behavior is deliberately simple: the repository returns
`{ message: "<tool_name> ready" }`, the MCP tool exposes that as structured
content, and the contract test verifies the result. Replace the domain type,
use case, repository port, infrastructure adapter, schema, and test with the
real behavior for your server.

## Define Tools With Zod

Generated projects use `@mcp-craftsman/zod` because it keeps runtime validation,
TypeScript inference, and JSON Schema export in one place.

```ts
import { defineZodTool } from "@mcp-craftsman/zod";
import * as z from "zod";

export const echoTool = defineZodTool({
  name: "echo_value",
  description: "Echoes a value.",
  policy: "read",
  input: z.object({
    value: z.string(),
  }),
  output: z.object({
    value: z.string(),
  }),
  annotations: {
    readOnlyHint: true,
  },
  handler: (input) => ({
    structuredContent: {
      value: input.value,
    },
  }),
});
```

`defineZodTool`:

- parses tool input before calling your handler;
- converts Zod schemas to JSON Schema;
- validates `structuredContent` when it is returned;
- defaults `returnsStructuredContent` to `true`.

Invalid input errors are stable:

```text
echo_value received invalid input.
```

Invalid structured output errors are also stable:

```text
echo_value returned invalid structured content.
```

## Define Tools With Raw JSON Schema

Use `@mcp-craftsman/core` directly when you already have JSON Schema or do not
want Zod.

```ts
import { defineTool } from "@mcp-craftsman/core";

export const echoTool = defineTool<{ value: string }, { value: string }>({
  name: "echo_value",
  description: "Echoes a value.",
  policy: "read",
  inputSchema: {
    type: "object",
    properties: {
      value: { type: "string" },
    },
    required: ["value"],
  },
  outputSchema: {
    type: "object",
    properties: {
      value: { type: "string" },
    },
    required: ["value"],
  },
  returnsStructuredContent: true,
  annotations: {
    readOnlyHint: true,
  },
  handler: (input) => ({
    structuredContent: {
      value: input.value,
    },
  }),
});
```

For raw tools, input parsing is your responsibility. The core package exports
small helpers such as `requireObjectInput`, `readRequiredStringField`,
`readOptionalNumberField`, and `readQueryLimitInput`.

## Compose The App

Register tools explicitly:

```ts
import { createCapabilityRegistry, createMcpApp } from "@mcp-craftsman/core";

import { echoTool } from "./features/echo/index.js";
import { healthTool } from "./features/health/index.js";

export const registry = createCapabilityRegistry([
  echoTool,
  healthTool,
]);

export function createApp() {
  return createMcpApp({
    name: "my-server",
    version: "0.1.0",
    registry,
  });
}
```

The registry is sorted and validated when the app is created. Public tools
should be reachable through the package root only, for example
`@mcp-craftsman/core`, not private paths under `@mcp-craftsman/core/src`.

## Serve The App

The generated `src/main.ts` is usually enough:

```ts
import { serveMcpApp } from "@mcp-craftsman/node";

import { createApp } from "./app.js";

await serveMcpApp(createApp);
```

If your app needs runtime configuration, accept the config in your factory:

```ts
import { serveMcpApp, type RuntimeConfig } from "@mcp-craftsman/node";

import { createApp } from "./app.js";

export type AppConfig = RuntimeConfig & {
  readonly apiBaseUrl: string;
};

await serveMcpApp((config) =>
  createApp({
    ...config,
    apiBaseUrl: process.env.API_BASE_URL ?? "https://example.test",
  }),
);
```

## Add A CLI

`@mcp-craftsman/node` includes a small CLI builder for apps that want common
commands:

```ts
import { createMcpCli, isCliEntrypoint } from "@mcp-craftsman/node";

import { createApp } from "./app.js";

export const cli = createMcpCli({
  appName: "my-server",
  createApp,
});

if (isCliEntrypoint("my-server")) {
  cli.run().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
```

Built-in commands:

```bash
my-server serve
my-server status
my-server tools
my-server call health_status '{}'
my-server setup
my-server setup --force
```

You can add custom commands through the `commands` option.

## Test Tool Contracts

Use `callTool` for fast tests without starting a transport:

```ts
import { describe, expect, it } from "vitest";
import { callTool } from "@mcp-craftsman/core";

import { createApp } from "../src/app.js";

describe("echo_value", () => {
  it("returns structured content", async () => {
    await expect(callTool(createApp(), "echo_value", { value: "abc" })).resolves.toEqual({
      structuredContent: {
        value: "abc",
      },
    });
  });
});
```

Generated projects also include a public capability contract that checks:

- every public tool is covered by tests;
- every tool has an output schema;
- read tools declare `readOnlyHint: true`;
- invalid input errors are stable;
- unknown tool names return a stable error.

## Quality

Generated projects expose:

```bash
pnpm quality
```

That delegates to:

```bash
mcp-craftsman quality
```

The quality command runs dependency checks, TypeScript checks, linting,
architecture tests, and the unit/integration/contract test suite configured in
the generated project.

## Package Reference

`@mcp-craftsman/core`:

- `defineTool`
- `createCapabilityRegistry`
- `createMcpApp`
- `callTool`
- input parsing helpers
- registry/schema validation helpers
- architecture assertion helpers

`@mcp-craftsman/zod`:

- `defineZodTool`
- Zod input parsing
- Zod output validation
- JSON Schema export through `z.toJSONSchema`

`@mcp-craftsman/node`:

- `serveMcpApp`
- `startStdioServer`
- `startHttpServer`
- `loadRuntimeConfig`
- `createMcpCli`
- setup-task helpers
- local resource helpers
- atomic write and lock-file helpers

`@mcp-craftsman/cli`:

- `mcp-craftsman init`
- `mcp-craftsman generate feature`
- `mcp-craftsman quality`
- public helper APIs for project generators and automation

## More Detail

- [docs/generated-projects.md](docs/generated-projects.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/quality-and-release.md](docs/quality-and-release.md)

# Quality And Release

## Local Quality

Run the complete gate:

```bash
pnpm quality
```

The root command runs:

```text
knip
tsc --noEmit
eslint packages --fix
dependency-cruiser
vitest architecture tests
vitest unit tests with coverage
```

## Build

```bash
pnpm build
```

Each package writes build output to its own `dist/` directory.

## Release Validation

```bash
pnpm release:framework
```

The script:

1. runs `pnpm quality`;
2. removes package `dist/` directories;
3. builds `core`, `node`, and `cli`;
4. packs all packages into a temporary directory to validate npm artifacts.

Packing uses pnpm so `workspace:^` dependencies are converted to normal semver ranges in published package metadata.

## Publish Order

Publish packages in dependency order:

```text
@mcp-craftman/core
@mcp-craftman/node
@mcp-craftman/cli
```

Current `latest` versions:

```text
@mcp-craftman/core@0.1.1
@mcp-craftman/node@0.1.1
@mcp-craftman/cli@0.1.2
```

## Notes

- Do not publish tarballs produced by `npm pack` from workspace packages; use pnpm packing or pnpm publishing so workspace dependencies are rewritten correctly.
- Do not commit npm tokens, `.npmrc` auth entries, package tarballs, `dist/`, `coverage/`, or `node_modules/`.
- If `npm publish` requires browser auth, complete the prompt for each package.

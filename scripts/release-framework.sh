#!/bin/sh
set -eu

pnpm quality

rm -rf packages/core/dist packages/node/dist packages/cli/dist packages/zod/dist

pnpm --filter @mcp-craftman/core build
pnpm --filter @mcp-craftman/node build
pnpm --filter @mcp-craftman/cli build
pnpm --filter @mcp-craftman/zod build

pack_dir=$(mktemp -d)
trap 'rm -rf "$pack_dir"' EXIT

for package_dir in packages/core packages/node packages/cli packages/zod; do
  (cd "$package_dir" && pnpm pack --pack-destination "$pack_dir" --json >/dev/null)
done

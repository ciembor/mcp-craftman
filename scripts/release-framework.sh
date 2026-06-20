#!/bin/sh
set -eu

pnpm quality

rm -rf packages/core/dist packages/node/dist packages/cli/dist packages/zod/dist

pnpm --filter @mcp-craftsman/core build
pnpm --filter @mcp-craftsman/node build
pnpm --filter @mcp-craftsman/cli build
pnpm --filter @mcp-craftsman/zod build

pack_dir=$(mktemp -d)
trap 'rm -rf "$pack_dir"' EXIT

for package_dir in packages/core packages/node packages/cli packages/zod; do
  (cd "$package_dir" && pnpm pack --pack-destination "$pack_dir" --json >/dev/null)
done

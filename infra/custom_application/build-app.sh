#!/usr/bin/env sh
# DataRobot build hook — executed after Dockerfile completes
# Installs Bun dependencies and builds the production assets.
set -eu
# Enable pipefail where supported (e.g., Bash). POSIX /bin/sh in Debian lacks it.
if (set -o | grep -q pipefail) 2>/dev/null; then
  set -o pipefail
fi

echo "Installing dependencies (bun install)…"
bun install

echo "Building Tailwind CSS (bun run tailwind:build)…"
bun run tailwind:build

#!/usr/bin/env sh
# DataRobot start hook — container entrypoint
# Starts the Bun server that listens on PORT (8080 set in Dockerfile).
set -eu
# Enable pipefail where supported (e.g., Bash). POSIX /bin/sh in Debian lacks it.
if (set -o | grep -q pipefail) 2>/dev/null; then
  set -o pipefail
fi

# Load environment variables from .env file (uploaded via Pulumi)
# This overrides the restricted API token provided by DataRobot runtime
if [ -f .env ]; then
  echo "📝 Loading environment variables from .env file..."
  # Use set -a to automatically export all variables
  set -a
  . ./.env
  set +a
  echo "✅ Environment variables loaded from .env"
else
  echo "⚠️  Warning: .env file not found, using runtime environment variables"
fi

echo ""
echo "🔧 Environment Variables Debug:"
echo "DATAROBOT_API_TOKEN: ${DATAROBOT_API_TOKEN:+[SET - first 10 chars: $(echo "$DATAROBOT_API_TOKEN" | cut -c1-10)...]}"
echo "DATAROBOT_ENDPOINT: ${DATAROBOT_ENDPOINT:-[NOT SET]}"
echo "PORT: ${PORT:-8080}"
echo "NODE_ENV: ${NODE_ENV:-[NOT SET]}"
echo ""
echo "Starting application on port ${PORT:-8080}…"
exec bun index.ts

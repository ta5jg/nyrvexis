#!/bin/sh
# Applies SQL migrations when KR_DATABASE_URL is set, then starts the gateway.
set -e
if [ -n "$KR_DATABASE_URL" ]; then
  find /app/services/gateway/migrations -maxdepth 1 -name '*.sql' | sort | while IFS= read -r f; do
    echo "migrate: $f"
    psql "$KR_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
fi
exec node /app/services/gateway/dist/index.js

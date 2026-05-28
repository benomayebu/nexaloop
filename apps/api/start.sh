#!/bin/sh
set -e

echo "[start.sh] Waiting for database..."
MAX_RETRIES=15
RETRY=0
until npx prisma migrate deploy 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[start.sh] ERROR: Database not ready after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "[start.sh] Retrying ($RETRY/$MAX_RETRIES)..."
  sleep 3
done

echo "[start.sh] Migrations done. Starting API..."
exec node dist/main

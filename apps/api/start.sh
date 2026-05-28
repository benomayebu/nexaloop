#!/bin/sh
set -e

echo "Waiting for database to be ready..."
MAX_RETRIES=15
RETRY=0
until npx prisma migrate deploy 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Database not ready (attempt $RETRY/$MAX_RETRIES), retrying in 3s..."
  sleep 3
done

echo "Migrations applied. Starting API server..."
exec node dist/main

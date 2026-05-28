#!/bin/sh
set -e

echo "========================================"
echo "[start.sh] Starting N.E.X.A Loop API..."
echo "[start.sh] NODE_ENV=$NODE_ENV"
echo "[start.sh] PORT=$PORT"
echo "[start.sh] DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo 'SET' || echo 'MISSING')"
echo "[start.sh] JWT_SECRET is $([ -n "$JWT_SECRET" ] && echo 'SET' || echo 'MISSING')"
echo "========================================"

echo "[start.sh] Waiting for database to accept connections..."
MAX_RETRIES=15
RETRY=0
until npx prisma migrate deploy; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[start.sh] ERROR: Database not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "[start.sh] Database not ready (attempt $RETRY/$MAX_RETRIES), retrying in 3s..."
  sleep 3
done

echo "[start.sh] Migrations applied successfully."
echo "[start.sh] Starting node dist/main..."
exec node dist/main

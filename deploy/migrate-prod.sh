#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_BEFORE_MIGRATE="${BACKUP_BEFORE_MIGRATE:-1}"

cd "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER required}"

if [ "$BACKUP_BEFORE_MIGRATE" = "1" ]; then
  ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" ./deploy/backup-db.sh
fi

echo "Ensuring db is healthy..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_isready -U "$POSTGRES_USER" >/dev/null

echo "Running migrations (node dist/db/migrate.js)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm --no-deps \
  --entrypoint node api dist/db/migrate.js

echo "Migrations finished."

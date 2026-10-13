#!/usr/bin/env sh
set -eu

BACKUP_PATH="${1:?Usage: $0 path/to/backup.sql.gz}"
PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
SERVICE_DB="${SERVICE_DB:-db}"

cd "$PROJECT_DIR"

if [ ! -f "$BACKUP_PATH" ]; then
  echo "Backup not found: $BACKUP_PATH" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"

echo "Restoring $BACKUP_PATH into ${POSTGRES_DB} (destructive)"
gzip -dc "$BACKUP_PATH" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "Restore finished. Restart api if it was stopped: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d api"

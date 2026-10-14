#!/usr/bin/env sh
set -eu

BACKUP_PATH="${1:?Usage: CONFIRM=YES $0 path/to/backup.dump}"
PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
SERVICE_DB="${SERVICE_DB:-db}"

cd "$PROJECT_DIR"

if [ "${CONFIRM:-}" != "YES" ]; then
  echo "Refusing destructive restore. Re-run with CONFIRM=YES" >&2
  echo "For a safe practice restore use: ./deploy/restore-db-isolated.sh $BACKUP_PATH" >&2
  exit 1
fi

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

case "$BACKUP_PATH" in
  *.dump)
    echo "Restoring custom-format dump into ${POSTGRES_DB} (destructive)"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api >/dev/null 2>&1 || true
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
      pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner \
      <"$BACKUP_PATH"
    ;;
  *.sql.gz)
    echo "Restoring legacy sql.gz into ${POSTGRES_DB} (destructive)"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api >/dev/null 2>&1 || true
    gzip -dc "$BACKUP_PATH" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1
    ;;
  *)
    echo "Unsupported backup format (use .dump or legacy .sql.gz): $BACKUP_PATH" >&2
    exit 1
    ;;
esac

echo "Restore finished. Start api: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d api"

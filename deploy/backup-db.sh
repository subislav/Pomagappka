#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
SERVICE_DB="${SERVICE_DB:-db}"

cd "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"

mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$BACKUP_DIR/pomagappka-${STAMP}.sql.gz"

echo "Backing up ${POSTGRES_DB} to ${OUT}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --format=plain \
  | gzip -c >"$OUT"

echo "Pruning backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}"
find "$BACKUP_DIR" -name 'pomagappka-*.sql.gz' -type f -mtime "+$RETENTION_DAYS" -delete

echo "Done: $OUT ($(wc -c <"$OUT") bytes)"

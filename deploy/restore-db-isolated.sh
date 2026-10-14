#!/usr/bin/env sh
set -eu

BACKUP_PATH="${1:?Usage: $0 path/to/backup.dump}"
PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
SERVICE_DB="${SERVICE_DB:-db}"
ISOLATED_DB="${ISOLATED_DB:-pomagappka_restore_test}"

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

if [ "$ISOLATED_DB" = "$POSTGRES_DB" ]; then
  echo "ISOLATED_DB must differ from POSTGRES_DB" >&2
  exit 1
fi

echo "Creating isolated database ${ISOLATED_DB} (dropping if exists)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
  psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${ISOLATED_DB}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${ISOLATED_DB};
CREATE DATABASE ${ISOLATED_DB} OWNER ${POSTGRES_USER};
SQL

case "$BACKUP_PATH" in
  *.dump)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
      pg_restore -U "$POSTGRES_USER" -d "$ISOLATED_DB" --no-owner --clean --if-exists \
      <"$BACKUP_PATH"
    ;;
  *.sql.gz)
    gzip -dc "$BACKUP_PATH" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
      psql -U "$POSTGRES_USER" -d "$ISOLATED_DB" -v ON_ERROR_STOP=1
    ;;
  *)
    echo "Unsupported backup format (use .dump or legacy .sql.gz)" >&2
    exit 1
    ;;
esac

echo "Verifying table presence in ${ISOLATED_DB}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T "$SERVICE_DB" \
  psql -U "$POSTGRES_USER" -d "$ISOLATED_DB" -v ON_ERROR_STOP=1 -c \
  "SELECT COUNT(*) AS migration_rows FROM drizzle.__drizzle_migrations;"

echo "Isolated restore OK. Drop when finished:"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T $SERVICE_DB \\"
echo "    psql -U $POSTGRES_USER -d postgres -c 'DROP DATABASE IF EXISTS $ISOLATED_DB;'"

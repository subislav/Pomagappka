#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
BACKUP_BEFORE_UPDATE="${BACKUP_BEFORE_UPDATE:-1}"

cd "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

if [ "$BACKUP_BEFORE_UPDATE" = "1" ]; then
  echo "Creating pre-update backup..."
  ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" ./deploy/backup-db.sh
fi

echo "Pulling images where applicable and rebuilding app images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull db caddy || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo "Checking health..."
ENV_FILE="$ENV_FILE" COMPOSE_FILE="$COMPOSE_FILE" ./deploy/health-prod.sh

echo "Update complete."

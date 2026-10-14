#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

cd "$PROJECT_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
. "./$ENV_FILE"
set +a

echo "== Compose ps =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo "== Internal API /health =="
BODY=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api \
  wget -qO- http://127.0.0.1:3000/health)
echo "$BODY"
echo "$BODY" | grep -q '"status":"ok"'
echo "$BODY" | grep -q '"database":"up"'

if [ -n "${DOMAIN:-}" ]; then
  echo "== Public https://${DOMAIN}/api/health =="
  if curl -fsS --max-time 15 "https://${DOMAIN}/api/health" >/tmp/pomagappka-health.json 2>/dev/null; then
    cat /tmp/pomagappka-health.json
    grep -q '"status":"ok"' /tmp/pomagappka-health.json
    rm -f /tmp/pomagappka-health.json
  else
    echo "(skipped or failed — DNS/cert may not be ready yet)"
  fi
fi

echo "Health checks passed."

#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-.env.prod}"

cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  if [ -f .env.prod.example ]; then
    cp .env.prod.example "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Created $ENV_FILE from .env.prod.example — edit secrets before continuing." >&2
    echo "Then re-run: ENV_FILE=$ENV_FILE ./deploy/setup-prod.sh" >&2
    exit 1
  fi
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

chmod 600 "$ENV_FILE" 2>/dev/null || true

set -a
. "./$ENV_FILE"
set +a

missing=0
for key in DOMAIN CADDY_EMAIL POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL \
  APP_URL API_URL BETTER_AUTH_URL BETTER_AUTH_SECRET EMAIL_FROM EMAIL_PROVIDER; do
  eval "val=\${$key:-}"
  if [ -z "$val" ] || echo "$val" | grep -Eq 'your-domain|replace-with|re_xxxxxxxx'; then
    echo "Configure $key in $ENV_FILE" >&2
    missing=1
  fi
done

if [ "$EMAIL_PROVIDER" = "resend" ]; then
  if [ -z "${RESEND_API_KEY:-}" ] || echo "${RESEND_API_KEY}" | grep -Eq '^re_x+$|re_xxxxxxxx'; then
    echo "Configure RESEND_API_KEY in $ENV_FILE" >&2
    missing=1
  fi
fi

if [ "$missing" -ne 0 ]; then
  exit 1
fi

mkdir -p backups
chmod 700 backups

echo "Building and starting production stack (db, api, web, caddy)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo "Waiting for API health..."
i=0
while [ "$i" -lt 60 ]; do
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api \
    wget -qO- http://127.0.0.1:3000/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo "API healthy."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo "Next: point DNS A record for \$DOMAIN at this host, then curl https://\$DOMAIN/api/health"
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done

echo "API did not become healthy in time. Check: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs api" >&2
exit 1

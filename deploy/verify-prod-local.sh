#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-https://localhost}"

echo "Checking ${BASE_URL}/api/health"
BODY=$(curl -fsSk "${BASE_URL}/api/health")
echo "$BODY" | grep -q '"status":"ok"'
echo "$BODY" | grep -q '"database":"up"'

echo "Checking SPA shell"
curl -fsSk -o /dev/null -w "SPA HTTP %{http_code}\n" "${BASE_URL}/"

echo "Prod-local stack looks healthy."

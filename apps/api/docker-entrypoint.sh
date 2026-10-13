#!/bin/sh
set -eu

echo "Running database migrations..."
node dist/db/migrate.js

echo "Starting API..."
exec node dist/index.js

#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create .env from .env.example, or run 'make worktree-env' and use .env.worktree."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

POSTGRES_DB="${POSTGRES_DB:-agentharness}"
POSTGRES_USER="${POSTGRES_USER:-agentharness}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-agentharness}"
DATABASE_URL="${DATABASE_URL:-}"

export PGPASSWORD="$POSTGRES_PASSWORD"

db_host=""
db_port="${POSTGRES_PORT:-5432}"
db_name="$POSTGRES_DB"

parse_database_url() {
  local rest authority hostport path port_part

  rest="${DATABASE_URL#*://}"
  rest="${rest%%\?*}"
  authority="${rest%%/*}"
  path="${rest#*/}"

  if [ "$authority" = "$rest" ]; then
    path=""
  fi

  hostport="${authority##*@}"

  if [[ "$hostport" == \[* ]]; then
    db_host="${hostport#\[}"
    db_host="${db_host%%]*}"
    port_part="${hostport#*\]}"
    if [[ "$port_part" == :* ]] && [ -n "${port_part#:}" ]; then
      db_port="${port_part#:}"
    fi
  else
    db_host="${hostport%%:*}"
    if [[ "$hostport" == *:* ]] && [ -n "${hostport##*:}" ]; then
      db_port="${hostport##*:}"
    fi
  fi

  if [ -n "$path" ]; then
    db_name="${path%%/*}"
  fi
}

if [ -n "$DATABASE_URL" ]; then
  parse_database_url
fi

is_local() {
  [ -z "$DATABASE_URL" ] || [ "$db_host" = "localhost" ] || [ "$db_host" = "127.0.0.1" ] || [ "$db_host" = "::1" ]
}

if is_local; then
  # ---------- Local: use manual PostgreSQL ----------
  echo "==> Ensuring PostgreSQL is running on localhost:5432..."
  
  if ! pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" > /dev/null 2>&1; then
    echo "PostgreSQL is not running. Please start PostgreSQL service."
    exit 1
  fi

  echo "==> Waiting for PostgreSQL to be ready..."
  until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" > /dev/null 2>&1; do
    sleep 1
  done

  echo "==> Ensuring database '$POSTGRES_DB' exists..."
  if ! psql -h localhost -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
    echo "Creating database $POSTGRES_DB..."
    createdb -h localhost -U "$POSTGRES_USER" "$POSTGRES_DB"
  else
    echo "Database $POSTGRES_DB already exists"
  fi

  echo "✓ PostgreSQL ready (local manual). Database: $POSTGRES_DB"
else
  # ---------- Remote: skip Docker, verify connectivity ----------
  echo "==> Remote database detected (host: $db_host). Skipping local checks."
  if command -v pg_isready > /dev/null 2>&1; then
    echo "==> Waiting for PostgreSQL at $db_host:$db_port to be ready..."
    until pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; do
      sleep 1
    done
    echo "✓ PostgreSQL ready (remote: $db_host:$db_port). Database: $db_name"
  else
    echo "==> pg_isready not found. Skipping remote connectivity preflight."
    echo "✓ PostgreSQL configured (remote: $db_host:$db_port). Database: $db_name"
  fi
fi
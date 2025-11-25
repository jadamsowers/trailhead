#!/usr/bin/env zsh
set -euo pipefail

# Atlas migration helper script
# Usage:
#   backend/scripts/migrate.sh [status|apply|hash|all]
# Defaults to 'all'.

DIR="file://backend/migrations"

# Prefer local docker-compose Postgres using credentials.txt
# Fallback to Atlas docker dev URL if credentials.txt not found
CREDS_FILE="$(dirname "$0")/../../credentials.txt"
if [[ -f "$CREDS_FILE" ]]; then
  pg_user=$(grep -E '^PostgreSQL User:' "$CREDS_FILE" | awk -F': ' '{print $2}')
  pg_pass=$(grep -E '^PostgreSQL Password:' "$CREDS_FILE" | awk -F': ' '{print $2}')
  pg_db=$(grep -E '^PostgreSQL Database:' "$CREDS_FILE" | awk -F': ' '{print $2}')
  pg_port=$(grep -E '^PostgreSQL Port:' "$CREDS_FILE" | awk -F': ' '{print $2}')
  : "${pg_user:=trailhead}"
  : "${pg_db:=trailhead}"
  : "${pg_port:=5432}"
  if [[ -n "$pg_pass" ]]; then
    URL="postgresql://${pg_user}:${pg_pass}@localhost:${pg_port}/${pg_db}?sslmode=disable"
  else
    URL="postgresql://${pg_user}@localhost:${pg_port}/${pg_db}?sslmode=disable"
  fi
else
  URL="docker://postgres/15/dev"
fi

cmd=${1:-all}

case "$cmd" in
  status)
    atlas migrate status --dir "$DIR" --url "$URL"
    ;;
  apply)
    atlas migrate apply --dir "$DIR" --url "$URL"
    ;;
  hash)
    atlas migrate hash --dir "$DIR"
    ;;
  all)
    atlas migrate status --dir "$DIR" --url "$URL" || true
    atlas migrate apply --dir "$DIR" --url "$URL"
    atlas migrate hash --dir "$DIR"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Usage: $0 [status|apply|hash|all]" >&2
    exit 1
    ;;
 esac

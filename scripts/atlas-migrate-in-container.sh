#!/usr/bin/env zsh
set -euo pipefail

# Script to run Atlas migrations inside the backend container using credentials from credentials.txt
CRED_FILE="$(dirname "$0")/../credentials.txt"
if [[ ! -f "$CRED_FILE" ]]; then
  echo "credentials.txt not found!" >&2
  exit 1
fi

pg_user=$(grep -E '^PostgreSQL User:' "$CRED_FILE" | awk -F': ' '{print $2}')
pg_pass=$(grep -E '^PostgreSQL Password:' "$CRED_FILE" | awk -F': ' '{print $2}')
pg_db=$(grep -E '^PostgreSQL Database:' "$CRED_FILE" | awk -F': ' '{print $2}')
pg_port=$(grep -E '^PostgreSQL Port:' "$CRED_FILE" | awk -F': ' '{print $2}')
: "${pg_user:=trailhead}"
: "${pg_db:=trailhead}"
: "${pg_port:=5432}"

if [[ -z "$pg_pass" ]]; then
  echo "No Postgres password found in credentials.txt!" >&2
  exit 1
fi

    ATLAS_URL="postgresql://${pg_user}:${pg_pass}@postgres:${pg_port}/${pg_db}?sslmode=disable"
    MIGRATIONS_DIR="file:///app/migrations"
echo "Running Atlas migrations in backend container..."
    docker-compose exec backend atlas migrate apply --dir "$MIGRATIONS_DIR" --url "$ATLAS_URL"
echo "Atlas migrations complete."
  echo "Updating atlas.sum hash file..."
  docker-compose exec backend atlas migrate hash --dir "$MIGRATIONS_DIR"

  echo "Atlas migrations and hash update complete."

  # Check latest applied migration version in DB
  echo "Checking latest applied migration version in database..."
  LATEST_DB_VERSION=$(docker-compose exec -T backend env PGPASSWORD="$pg_pass" psql -h postgres -U "$pg_user" -d "$pg_db" -tAc 'SELECT version FROM "atlas_schema_revisions"."atlas_schema_revisions" ORDER BY executed_at DESC LIMIT 1;')

  # Get latest migration file version from atlas.sum (skip comment/hash lines, extract version number from filename)
  # Format: 20251125000003_description.sql - we want just the version number
  LATEST_FILE_VERSION=$(grep -v '^h' backend/migrations/atlas.sum | awk '{print $1}' | sed 's/\.sql$//' | sed 's/_.*$//' | tail -n 1)

  echo "Latest DB version:   $LATEST_DB_VERSION"
  echo "Latest file version: $LATEST_FILE_VERSION"

  if [[ "$LATEST_DB_VERSION" != "$LATEST_FILE_VERSION" ]]; then
    echo "WARNING: Database schema version does not match latest migration file!" >&2
    exit 1
  else
    echo "Database schema version matches latest migration file."
  fi

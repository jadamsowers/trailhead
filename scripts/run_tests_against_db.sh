#!/usr/bin/env bash
# Run the project's integration tests against the containerized Postgres
# - Starts docker-compose
# - Waits for Postgres to become healthy
# - Applies Atlas migrations inside the backend container
# - Runs pytest locally if available, otherwise runs pytest inside the backend container

set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

COMPOSE_FILE="docker-compose.yml"
POSTGRES_SERVICE=${POSTGRES_SERVICE:-postgres}
POSTGRES_USER=${POSTGRES_USER:-trailhead}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-changeme}
POSTGRES_DB=${POSTGRES_DB:-trailhead}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

echo "Bringing up docker-compose services..."
docker-compose up -d

# Wait for Postgres to be ready using pg_isready inside the postgres container
echo "Waiting for Postgres to become ready..."
RETRIES=60
COUNT=0
until docker-compose exec -T "$POSTGRES_SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "Postgres did not become ready in time" >&2
    exit 2
  fi
  sleep 2
done

echo "Postgres is ready. Applying Atlas migrations inside backend container..."
# Apply Atlas migrations using the backend container's Atlas binary (docker-compose command mirrors docker-compose.yml behavior)
MIGRATE_CMD="atlas migrate apply --env sqlalchemy --url \"postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVICE}:5432/${POSTGRES_DB}?sslmode=disable\""
# Run the migrate command in the backend container
docker-compose exec backend sh -c "$MIGRATE_CMD || echo 'Atlas migrate failed or already applied'"

# Export DATABASE_URL for local pytest runs to connect to the containerized Postgres
export DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# Run tests: prefer local pytest if available (developer environment); otherwise run inside backend container
if command -v pytest >/dev/null 2>&1; then
  echo "Running pytest locally against containerized Postgres..."
  pytest -q backend/tests
else
  echo "pytest not found locally; running pytest inside backend container (will install test deps)..."
  docker-compose exec backend sh -c "pip install -r requirements-test.txt || true && pytest -q backend/tests"
fi

echo "Tests completed."

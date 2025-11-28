#!/bin/bash
set -e

echo "🚀 Starting Trailhead Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
python wait-for-db.py

# Hash migrations to ensure atlas.sum is up to date
echo "🔐 Hashing migration files..."
atlas migrate hash --env sqlalchemy

# Build database URL
DB_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?sslmode=disable"

# Run Atlas migrations
echo "🗄️  Running Atlas migrations..."
if atlas migrate apply --env sqlalchemy --url "$DB_URL"; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️  Migration apply failed, checking if this is initial setup..."
    # On first run, Atlas may need to initialize its schema tracking
    # Try status to initialize the tracking table
    atlas migrate status --env sqlalchemy --url "$DB_URL" || true
    # Try applying again
    if atlas migrate apply --env sqlalchemy --url "$DB_URL"; then
        echo "✅ Migrations applied successfully on retry"
    else
        echo "❌ Migration apply failed"
        exit 1
    fi
fi

# Initialize database with seed data
echo "🌱 Initializing database..."
if python -m app.db.init_db; then
    echo "✅ Database initialized successfully"
else
    echo "ℹ️  Database already initialized (this is normal)"
fi

# Start the application
echo "🎯 Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 ${UVICORN_RELOAD:+--reload}

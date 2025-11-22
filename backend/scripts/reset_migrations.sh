#!/bin/bash
# Script to reset Alembic migrations to a clean state
# This script removes all migration files and creates a fresh initial migration

set -e

echo "🧹 Resetting Alembic migrations..."

# Step 1: Remove all existing migration files
echo "📁 Removing old migration files..."
rm -rf alembic/versions/*.py
rm -rf alembic/versions/__pycache__

# Step 2: Clear the alembic_version table in the database
echo "🗄️  Clearing alembic_version table..."
docker-compose exec -T postgres psql -U scouting_outing -d scouting_outing_manager -c "DELETE FROM alembic_version;"

# Step 3: Generate new initial migration
echo "📝 Generating new initial migration..."
docker-compose exec -T backend python -m alembic revision --autogenerate -m "initial_schema"

# Step 4: Stamp the database with the new migration
echo "✅ Stamping database with new migration..."
docker-compose exec -T backend python -m alembic stamp head

echo "✨ Migration reset complete!"
echo ""
echo "📋 Summary:"
echo "  - All old migrations removed"
echo "  - New initial migration created"
echo "  - Database stamped with current schema"
echo ""
echo "⚠️  Note: This assumes your database schema is already up to date."
echo "   If you need to apply migrations to a fresh database, run:"
echo "   docker-compose exec backend python -m alembic upgrade head"
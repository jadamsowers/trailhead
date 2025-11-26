#!/bin/bash
# Script to reset Alembic migrations to a clean state
# This script removes all migration files and creates a fresh initial migration

set -e

echo "🧹 Resetting Alembic migrations..."

# Step 1: Remove all existing migration files
echo "📁 Removing old migration files..."
rm -rf backend/migrations/*.sql
rm -f backend/migrations/atlas.sum

# Step 2: Clear the atlas_schema_revisions table in the database
echo "🗄️  Clearing atlas_schema_revisions table..."
docker-compose exec -T postgres psql -U trailhead -d trailhead -c 'DELETE FROM "atlas_schema_revisions"."atlas_schema_revisions";'

# Step 3: Generate new initial migration
echo "📝 Generating new initial migration..."
docker-compose exec -T backend atlas migrate diff initial_schema --env sqlalchemy

# Step 4: Stamp the database with the new migration
echo "✅ Stamping database with new migration..."
# Get the version from the generated file (assuming it's the only one or the last one)
VERSION=$(ls backend/migrations/*.sql | xargs basename | cut -d'_' -f1 | sort | tail -n 1)

if [ -z "$VERSION" ]; then
    echo "❌ Error: Could not find generated migration file."
    exit 1
fi

echo "   Marking version $VERSION as applied..."
docker-compose exec -T backend atlas migrate set $VERSION --env sqlalchemy

echo "✨ Migration reset complete!"
echo ""
echo "📋 Summary:"
echo "  - All old migrations removed"
echo "  - New initial migration created ($VERSION)"
echo "  - Database stamped with current schema"
echo ""
echo "⚠️  Note: This assumes your database schema is already up to date."
echo "   If you need to apply migrations to a fresh database, run:"
echo "   docker-compose exec backend atlas migrate apply --env sqlalchemy"
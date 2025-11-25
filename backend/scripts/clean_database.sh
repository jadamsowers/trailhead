#!/bin/bash
# Script to completely reset the database schema to a clean state
# This will drop all tables, clear migrations, and recreate from scratch

set -e

echo "🧹 Starting database schema cleanup..."
echo ""

# Step 1: Drop all tables in the database
echo "🗑️  Step 1: Dropping all tables..."
docker-compose exec -T postgres psql -U scouting_outing -d scouting_outing_manager <<EOF
DO \$\$ DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
END \$\$;
EOF

echo "✅ All tables dropped"
echo ""

# Step 2: Remove all migration files
echo "📁 Step 2: Removing old migration files..."
rm -rf backend/migrations/*.sql
rm -f backend/migrations/atlas.sum

echo "✅ Migration files removed"
echo ""

# Step 3: Generate fresh initial migration
echo "📝 Step 3: Generating fresh initial migration from models..."
docker-compose exec -T backend atlas migrate diff initial_schema --env sqlalchemy

echo "✅ Initial migration generated"
echo ""

# Step 4: Apply the migration
echo "🚀 Step 4: Applying migration to create all tables..."
docker-compose exec -T backend atlas migrate apply --env sqlalchemy

echo "✅ Migration applied"
echo ""

# Step 5: Initialize database with admin user
echo "👤 Step 5: Creating initial admin user..."
docker-compose exec -T backend python -m app.db.init_db

echo "✅ Admin user created"
echo ""

# Step 6: Verify the schema
echo "🔍 Step 6: Verifying database schema..."
docker-compose exec -T postgres psql -U scouting_outing -d scouting_outing_manager -c "\dt"

echo ""
echo "✨ Database schema cleanup complete!"
echo ""
echo "📋 Summary:"
echo "  ✓ All old tables dropped"
echo "  ✓ All old migrations removed"
echo "  ✓ Fresh migration generated from models"
echo "  ✓ Migration applied to database"
echo "  ✓ Admin user initialized"
echo ""
echo "🎉 Your database is now in a clean state!"
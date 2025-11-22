# Alembic Migration Cleanup Guide

## Overview

This document describes the process of cleaning up and resetting Alembic migrations to establish a clean baseline from the current database state.

## What Was Done

### 1. Removed All Old Migration Files
All 40+ migration files in [`backend/alembic/versions/`](../backend/alembic/versions/) were deleted, including:
- Multiple "initial_migration" files
- Merge head resolution files
- All historical schema changes

### 2. Updated Model Imports
Updated [`backend/alembic/env.py`](../backend/alembic/env.py) to ensure all models are imported:
- Added `FamilyMember`
- Added `FamilyMemberDietaryPreference`
- Added `FamilyMemberAllergy`

This ensures Alembic can detect all tables when generating migrations.

### 3. Cleared Database Migration History
Cleared the `alembic_version` table in the database to remove references to old migrations:
```sql
DELETE FROM alembic_version;
```

### 4. Generated New Initial Migration
Created a fresh initial migration ([`b4d04516ae79_initial_schema.py`](../backend/alembic/versions/b4d04516ae79_initial_schema.py)) that represents the current database state.

### 5. Stamped Database
Marked the database as being at the current migration version without running any migrations:
```bash
docker-compose exec backend python -m alembic stamp head
```

## Current State

- **Single migration file**: `b4d04516ae79_initial_schema.py`
- **Database state**: Marked as up-to-date with current schema
- **Migration history**: Clean slate with no historical baggage

## Future Workflow

### Creating New Migrations

When you need to make schema changes:

1. **Modify your models** in [`backend/app/models/`](../backend/app/models/)

2. **Generate migration**:
   ```bash
   docker-compose exec backend python -m alembic revision --autogenerate -m "description_of_changes"
   ```

3. **Review the generated migration** in `backend/alembic/versions/`

4. **Apply the migration**:
   ```bash
   docker-compose exec backend python -m alembic upgrade head
   ```

### Best Practices

1. **One developer at a time**: Coordinate schema changes to avoid merge conflicts
2. **Descriptive names**: Use clear, descriptive migration messages
3. **Review before applying**: Always review auto-generated migrations
4. **Test migrations**: Test both upgrade and downgrade paths
5. **Commit migrations**: Always commit migration files with your code changes

### Avoiding Future Merge Heads

If multiple developers create migrations simultaneously:

1. **Pull latest changes** before creating a new migration
2. **If merge heads occur**, create a merge migration:
   ```bash
   docker-compose exec backend python -m alembic merge heads -m "merge_description"
   ```
3. **Coordinate with team** to prevent simultaneous schema changes

## Reset Script

A convenience script has been created at [`backend/scripts/reset_migrations.sh`](../backend/scripts/reset_migrations.sh) that automates the entire cleanup process.

**⚠️ WARNING**: This script should only be used when you want to completely reset your migration history. It assumes your database schema is already correct.

### Usage

```bash
cd backend
./scripts/reset_migrations.sh
```

### What the script does:
1. Removes all migration files
2. Clears the `alembic_version` table
3. Generates a new initial migration
4. Stamps the database with the new migration

## Troubleshooting

### "Can't locate revision" Error

If you see this error, it means the database references a migration that no longer exists:

**Solution**: Clear the `alembic_version` table:
```bash
docker-compose exec postgres psql -U scouting_outing -d scouting_outing_manager -c "DELETE FROM alembic_version;"
```

Then stamp with the current head:
```bash
docker-compose exec backend python -m alembic stamp head
```

### Empty Migration Generated

If `alembic revision --autogenerate` creates an empty migration (only `pass` statements), it means:
- The database schema already matches your models
- Alembic couldn't detect any changes

This is normal after a cleanup when the database is already up-to-date.

### Database Connection Issues

If migrations fail with connection errors:
- Ensure Docker containers are running: `docker-compose up -d`
- Check database is accessible: `docker-compose exec postgres psql -U scouting_outing -d scouting_outing_manager -c "SELECT 1;"`
- Verify environment variables in `.env` files

## Related Documentation

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Project Migrations Guide](MIGRATIONS.md)
- [Database Schema](DATABASE_SCHEMA_CLEANUP.md)

## Summary

The migration cleanup establishes a clean baseline for future schema changes. The current database state is now the "initial" state, and all future changes will be tracked from this point forward. This eliminates the complexity of 40+ historical migrations and provides a fresh start for the project.
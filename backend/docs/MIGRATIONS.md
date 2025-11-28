# Database Migrations Guide

This guide explains how to manage database schema changes using Atlas for the Trailhead application.

## Overview

We use Atlas for database migrations, which provides:

- Version control for database schema via SQL migration files
- Declarative schema definitions from `schema.sql`
- Hash-based migration integrity verification
- Simple apply/status commands for deployment
- Sequential versioning (v001, v002, v003...) to avoid date conflicts

## Prerequisites

1. PostgreSQL database running and accessible (via Docker Compose)
2. Environment variables configured (see `.env.example`)
3. Atlas CLI installed: [https://atlasgo.io/getting-started](https://atlasgo.io/getting-started)
4. Python dependencies installed: `pip install -r requirements.txt`

## Initial Setup

### 1. Configure Environment

Copy the example environment file and update with your database credentials:

```bash
cd backend
cp .env.example .env
# Edit .env with your actual database credentials
```

Required environment variables:

- `POSTGRES_SERVER` - Database host (e.g., localhost)
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `POSTGRES_PORT` - Database port (default: 5432)
- `SECRET_KEY` - Secret key for password hashing

Optional environment variables for initial admin user:

- `INITIAL_ADMIN_EMAIL` - Email for initial admin user (default: `soadmin@scouthacks.net`)
- `INITIAL_ADMIN_PASSWORD` - Password for initial admin user (if not set, a random password will be generated)

### 2. Start Database and Backend

The backend automatically runs migrations on startup via Docker Compose:

```bash
cd /path/to/trailhead
docker compose up -d
```

The startup process (`backend/start.sh`) automatically:

1. Waits for the database to be ready
2. Applies all pending Atlas migrations
3. Initializes the database with seed data
4. Starts the FastAPI server

**On first run**, the script will:

- Create the `atlas_schema_revisions` table in the `public` schema
- Apply all migrations in order
- Create the initial admin user

### 3. Manual Migration Apply (Optional)

If you need to apply migrations manually (e.g., for development):

```bash
cd backend
atlas migrate apply --env sqlalchemy
```

This will:

1. Read migration files from `backend/migrations/`
2. Verify checksums from `migrations/atlas.sum`
3. Apply unapplied migrations in order
4. Track applied migrations in the `atlas_schema_revisions` table

**Note**: The Atlas configuration (`atlas.hcl`) is set to use the `public` schema for the revisions table to avoid schema qualification issues.

**Admin User Configuration:**

The initial admin user can be configured via environment variables in your `.env` file:

- `INITIAL_ADMIN_EMAIL` - Email address for the admin user (default: `soadmin@scouthacks.net`)
- `INITIAL_ADMIN_PASSWORD` - Password for the admin user (optional)

**Behavior:**

- If `INITIAL_ADMIN_PASSWORD` is set in `.env`, that password will be used
- If `INITIAL_ADMIN_PASSWORD` is not set, a random password will be generated and displayed in the terminal
- The email defaults to `soadmin@scouthacks.net` but can be changed via `INITIAL_ADMIN_EMAIL`

**Example `.env` configuration:**

```env
# Use a specific password
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=your_secure_password_here

# Or let the system generate a random password (leave INITIAL_ADMIN_PASSWORD unset)
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
# INITIAL_ADMIN_PASSWORD will be randomly generated
```

**⚠️ IMPORTANT:**

- Save the password shown in the terminal output if you let it generate randomly
- Change the admin password immediately after first login!

## Common Migration Tasks

### Creating a New Migration

When you modify SQLAlchemy models, create a migration file manually:

1. **Determine next version number** by checking existing migrations:

   ```bash
   cd backend/migrations
   ls -1 v*.sql | tail -1
   # If last is v008_add_outing_logistics_fields.sql, your new one is v009
   ```

2. **Create new migration file** with sequential version:

   ```bash
   cd backend/migrations
   # Example: v009_add_user_preferences.sql
   touch v009_add_user_preferences.sql
   ```

3. **Write the migration SQL**:

   ```sql
   -- Add user preferences table
   CREATE TABLE user_preferences (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       theme VARCHAR(20) DEFAULT 'light',
       created_at TIMESTAMP NOT NULL DEFAULT NOW()
   );

   CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

   COMMENT ON TABLE user_preferences IS 'User application preferences';
   ```

4. **Hash the migration** to update `migrations/atlas.sum`:

   ```bash
   cd backend
   atlas migrate hash --env sqlalchemy
   ```

**Always review the migration SQL** before applying it!

### Applying Migrations

Apply all pending migrations:

```bash
cd backend
atlas migrate apply --env sqlalchemy
```

Apply migrations up to a specific version:

```bash
cd backend
atlas migrate apply --env sqlalchemy --to-version v009_add_user_preferences
```

Dry run (preview without executing):

```bash
cd backend
atlas migrate apply --env sqlalchemy --dry-run
```

### Rolling Back Migrations

**Atlas does not have automatic rollback**. To revert a migration:

1. **Write a down migration** (e.g., `v010_revert_user_preferences.sql`):

   ```sql
   -- Revert: remove user preferences table
   DROP TABLE IF EXISTS user_preferences CASCADE;
   ```

2. **Hash and apply**:

   ```bash
   cd backend
   atlas migrate hash --env sqlalchemy
   atlas migrate apply --env sqlalchemy
   ```

**Best Practice**: For critical migrations, plan rollback SQL in advance and test both directions in development.

### Viewing Migration Status

Check which migrations are applied vs pending:

```bash
cd backend
atlas migrate status --env sqlalchemy
```

Example output:

```
Migration Status: PENDING
  -- Current Version: v008_add_outing_logistics_fields
  -- Next Version:    v009_add_user_preferences
  -- Pending:         1 migration
```

### Inspecting the Database Schema

View the current database schema:

```bash
cd backend
atlas schema inspect --env sqlalchemy --url "postgres://postgres:password@localhost:5432/trailhead?sslmode=disable"
```

## Migration Best Practices

### 1. Always Review Migration SQL

Atlas does not auto-generate migrations—you write raw SQL. Verify:

- Column types and constraints are correct
- Indexes are defined where needed
- Foreign keys have appropriate `ON DELETE` behavior
- Default values are set if columns are non-nullable
- Comments document the purpose of tables/columns

### 2. Test Migrations

Before applying to production:

1. Test on a development database
2. Run `atlas migrate apply --env sqlalchemy --dry-run` to preview
3. Apply with `atlas migrate apply --env sqlalchemy`
4. Verify with `atlas migrate status --env sqlalchemy`
5. Test application endpoints to confirm schema compatibility

### 3. Handle Data Migrations

For schema changes requiring data transformation, include it in the same migration file:

````sql
-- Add new column (nullable first)
ALTER TABLE outings ADD COLUMN new_field VARCHAR(255);

-- Migrate data
UPDATE outings SET new_field = old_field WHERE old_field IS NOT NULL;

-- Make column non-nullable
ALTER TABLE outings ALTER COLUMN new_field SET NOT NULL;

-- Drop old column
ALTER TABLE outings DROP COLUMN old_field;
```### 4. Use Transactions

Atlas migrations run in transactions by default. For operations that can't run in transactions (e.g., `CREATE INDEX CONCURRENTLY`), note this in comments:

```sql
-- Note: This migration must be run outside a transaction
-- Run manually if needed:
-- CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
````

### 5. Document Complex Migrations

Add comments to explain non-obvious changes:

```sql
-- Migration: Add support for multi-troop events
-- - Adds troop_number field to participants table
-- - Adds patrol_name field for youth organization
-- - Creates indexes for efficient troop-based queries

ALTER TABLE participants ADD COLUMN troop_number VARCHAR(50);
ALTER TABLE participants ADD COLUMN patrol_name VARCHAR(100);

CREATE INDEX idx_participants_troop ON participants(troop_number);
CREATE INDEX idx_participants_patrol ON participants(patrol_name);
```

### 6. Keep Migrations Idempotent When Possible

Use `IF NOT EXISTS` or `IF EXISTS` clauses where supported:

```sql
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

ALTER TABLE outings ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
```

### 7. Hash After Every Change

Always run `atlas migrate hash` after creating or editing a migration file:

```bash
cd backend
atlas migrate hash --env sqlalchemy
```

This updates `migrations/atlas.sum` with integrity checksums.

## Troubleshooting

### Migration Fails to Apply

1. **Check database connection**:

   ```bash
   docker compose ps postgres
   docker compose exec postgres psql -U postgres -d trailhead -c "SELECT 1;"
   ```

2. **Check migration status**:

   ```bash
   cd backend
   atlas migrate status --env sqlalchemy
   ```

3. **Inspect error logs**: Atlas will print the SQL statement that failed. Review and fix the migration file, then re-hash and re-apply.

### Database Out of Sync

If your database schema doesn't match migrations:

1. **Development**: Drop and recreate:

   ```bash
   docker compose down -v postgres
   docker compose up -d postgres
   cd backend
   atlas migrate apply --env sqlalchemy
   ```

2. **Production**:
   - Backup first: `pg_dump -h $POSTGRES_SERVER -U $POSTGRES_USER $POSTGRES_DB > backup.sql`
   - Manually inspect differences: `atlas schema inspect`
   - Write corrective migration to align state
   - Test on staging before production apply

### Hash Mismatch

If `atlas migrate apply` reports a hash mismatch:

- Someone edited a migration file after it was applied
- Re-run `atlas migrate hash --env sqlalchemy` to update checksums
- **Do not edit already-applied migrations in production**—write a new migration instead

### Version Conflicts

If multiple developers create migrations with overlapping version numbers:

1. Check the last version: `ls -1 backend/migrations/v*.sql | tail -1`
2. Rename conflicting migration to next sequential number (e.g., `v010`)
3. Re-run `atlas migrate hash --env sqlalchemy`
4. Coordinate via version control to avoid overlaps

### "relation atlas_schema_revisions.atlas_schema_revisions does not exist"

This error occurs on a fresh database when Atlas tries to query its tracking table before it's created. **This is automatically handled by the startup script** (`backend/start.sh`).

If you encounter this manually:

1. **Verify Atlas configuration** includes schema settings:

   ```hcl
   env "sqlalchemy" {
     src = "file://schema.sql"
     dev = "docker://postgres/15/dev?search_path=public"
     migration {
       dir = "file://migrations"
       revisions_schema = "public"
     }
   }
   ```

2. **Run status first** to initialize the tracking table:

   ```bash
   atlas migrate status --env sqlalchemy --url "postgresql://user:pass@host:5432/db?sslmode=disable"
   ```

3. **Then apply migrations**:
   ```bash
   atlas migrate apply --env sqlalchemy --url "postgresql://user:pass@host:5432/db?sslmode=disable"
   ```

The `revisions_schema = "public"` setting ensures Atlas creates the `atlas_schema_revisions` table in the correct schema.

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in staging environment
- [ ] Database backup created
- [ ] Migration SQL reviewed for performance impact (e.g., table locks)
- [ ] Estimated downtime calculated (if any)
- [ ] Rollback migration prepared (if critical)

### Deployment Steps

1. **Backup database**:

   ```bash
   pg_dump -h $POSTGRES_SERVER -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Apply migrations**:

   ```bash
   cd backend
   atlas migrate apply --env sqlalchemy
   ```

3. **Verify success**:

   ```bash
   atlas migrate status --env sqlalchemy
   # Should show "Migration Status: OK"
   ```

4. **Test application**:
   - Verify API endpoints work
   - Check data integrity
   - Test critical user flows

### Rollback Plan

If migration fails:

1. **Restore from backup**:

   ```bash
   psql -h $POSTGRES_SERVER -U $POSTGRES_USER $POSTGRES_DB < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Apply corrective migration** (if backup not needed):
   - Write a new migration to undo the change
   - Hash and apply as normal

## Kubernetes Deployment

For Kubernetes deployments, migrations should run as an init container or Job before the backend starts:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: trailhead-migrations
  namespace: trailhead
spec:
  template:
    spec:
      containers:
        - name: migrations
          image: trailhead-backend:latest
          command: ["atlas", "migrate", "apply", "--env", "sqlalchemy"]
          env:
            - name: POSTGRES_SERVER
              valueFrom:
                configMapKeyRef:
                  name: trailhead-config
                  key: postgres-server
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: trailhead-secrets
                  key: postgres-user
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: trailhead-secrets
                  key: postgres-password
            - name: POSTGRES_DB
              value: "trailhead"
      restartPolicy: OnFailure
```

Run before deploying the application:

```bash
kubectl apply -f k8s/migrations-job.yaml
kubectl wait --for=condition=complete job/trailhead-migrations --timeout=300s
kubectl apply -f k8s/backend-deployment.yaml
```

Alternatively, use an **init container** in the backend deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trailhead-backend
spec:
  template:
    spec:
      initContainers:
        - name: run-migrations
          image: trailhead-backend:latest
          command: ["atlas", "migrate", "apply", "--env", "sqlalchemy"]
          env:
            # ... same env vars as above
      containers:
        - name: backend
          image: trailhead-backend:latest
          # ... backend container spec
```

## Atlas Configuration

The project uses `backend/atlas.hcl` for Atlas configuration:

```hcl
env "sqlalchemy" {
  src = "file://schema.sql"
  dev = "docker://postgres/15/dev"
  migration {
    dir = "file://migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
```

- `src`: Source schema file (declarative SQL)
- `dev`: Development database URL (used for diffing and validation)
- `migration.dir`: Directory containing migration files
- `format.migrate.diff`: SQL formatting template

## Migration Versioning

We use **sequential versioning** (v001, v002, v003...) instead of timestamps to avoid conflicts when multiple migrations are created on the same day.

**Naming Convention**: `vXXX_descriptive_name.sql`

Examples:

- `v001_initial.sql`
- `v002_add_checkins_table.sql`
- `v009_add_user_preferences.sql`

**Finding Next Version**:

```bash
cd backend/migrations
ls -1 v*.sql | tail -1
# If last is v008_add_outing_logistics_fields.sql, next is v009
```

## Additional Resources

- [Atlas Documentation](https://atlasgo.io/docs)
- [Atlas CLI Reference](https://atlasgo.io/cli-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## Support

For issues or questions:

1. Check migration status: `atlas migrate status --env sqlalchemy`
2. Review migration files in `backend/migrations/`
3. Inspect database schema: `atlas schema inspect --env sqlalchemy`
4. Check application logs for SQL errors
5. Consult the Atlas documentation: https://atlasgo.io/docs

## Suggestion Engine Schema Update (API-Level)

The suggestion engine was updated to return flattened suggestion objects:

- `RequirementSuggestion`: `rank`, `requirement_number`, `description`, `match_score`, `matched_keywords`
- `MeritBadgeSuggestion`: `name`, `description`, `match_score`, `matched_keywords`

This change only affects Pydantic response schemas and does not introduce a new database table; therefore no SQL migration is required. Keywords for existing `rank_requirements` and `merit_badges` can be recalculated using:

```bash
cd backend
python scripts/recalculate_suggestions.py
```

Run this after updating CSV source data to refresh keyword arrays used by the suggestion engine.

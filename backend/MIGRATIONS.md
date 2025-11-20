# Database Migrations Guide

This guide explains how to manage database schema changes using Alembic for the Scouting Outing Manager application.

## Overview

We use Alembic for database migrations, which provides:
- Version control for database schema
- Automatic migration generation from SQLAlchemy models
- Safe upgrade and downgrade paths
- Migration history tracking

## Prerequisites

1. PostgreSQL database running and accessible
2. Environment variables configured (see `.env.example`)
3. Python dependencies installed: `pip install -r requirements.txt`

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

### 2. Create Initial Migration

Generate the initial migration from your models:

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

This will create a new migration file in `alembic/versions/` with all table definitions.

### 3. Apply Migrations

Run the migration to create all tables:

```bash
cd backend
alembic upgrade head
```

### 4. Seed Initial Data

Create the default admin user:

```bash
cd backend
python -m app.db.init_db
```

This creates an admin user with:
- Username: `admin`
- Password: `admin123`
- Email: `admin@scouttrips.local`

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

## Common Migration Tasks

### Creating a New Migration

When you modify SQLAlchemy models, create a new migration:

```bash
cd backend
alembic revision --autogenerate -m "Add new field to trips table"
```

Alembic will:
1. Compare your models to the current database schema
2. Generate a migration file with the differences
3. Save it in `alembic/versions/`

**Always review the generated migration** before applying it!

### Applying Migrations

Upgrade to the latest version:

```bash
cd backend
alembic upgrade head
```

Upgrade to a specific revision:

```bash
cd backend
alembic upgrade <revision_id>
```

### Rolling Back Migrations

Downgrade one migration:

```bash
cd backend
alembic downgrade -1
```

Downgrade to a specific revision:

```bash
cd backend
alembic downgrade <revision_id>
```

Downgrade all migrations:

```bash
cd backend
alembic downgrade base
```

### Viewing Migration Status

Check current database version:

```bash
cd backend
alembic current
```

View migration history:

```bash
cd backend
alembic history
```

View migration history with details:

```bash
cd backend
alembic history --verbose
```

## Migration Best Practices

### 1. Always Review Generated Migrations

Auto-generated migrations may not be perfect. Review and edit them before applying:

```python
# Check the generated file in alembic/versions/
# Verify:
# - Column types are correct
# - Indexes are properly defined
# - Foreign keys are correct
# - Default values are appropriate
```

### 2. Test Migrations

Before applying to production:

1. Test on a development database
2. Verify upgrade works: `alembic upgrade head`
3. Verify downgrade works: `alembic downgrade -1`
4. Test with actual data if possible

### 3. Handle Data Migrations

For complex schema changes that require data transformation:

```python
def upgrade() -> None:
    # 1. Add new column (nullable)
    op.add_column('trips', sa.Column('new_field', sa.String(), nullable=True))
    
    # 2. Migrate data
    connection = op.get_bind()
    connection.execute(
        text("UPDATE trips SET new_field = old_field WHERE old_field IS NOT NULL")
    )
    
    # 3. Make column non-nullable if needed
    op.alter_column('trips', 'new_field', nullable=False)
    
    # 4. Drop old column
    op.drop_column('trips', 'old_field')
```

### 4. Use Transactions

Alembic runs migrations in transactions by default. For operations that can't run in transactions:

```python
def upgrade() -> None:
    # Disable transaction for this operation
    op.execute("CREATE INDEX CONCURRENTLY idx_name ON table(column)")
```

### 5. Document Complex Migrations

Add comments to explain non-obvious changes:

```python
def upgrade() -> None:
    """
    Add support for multi-troop events.
    
    - Adds troop_number field to participants table
    - Adds patrol_name field for youth organization
    - Creates indexes for efficient troop-based queries
    """
    # Migration code here
```

## Troubleshooting

### Migration Fails to Apply

1. Check database connection:
   ```bash
   psql -h $POSTGRES_SERVER -U $POSTGRES_USER -d $POSTGRES_DB
   ```

2. Check current migration state:
   ```bash
   alembic current
   ```

3. Check for conflicting changes:
   ```bash
   alembic history
   ```

### Alembic Can't Detect Changes

If auto-generate doesn't detect your model changes:

1. Ensure models are imported in `alembic/env.py`
2. Check that `Base.metadata` includes your models
3. Verify model changes are saved

### Database Out of Sync

If your database schema doesn't match migrations:

1. **Development**: Drop and recreate:
   ```bash
   # Drop all tables
   alembic downgrade base
   # Recreate from scratch
   alembic upgrade head
   ```

2. **Production**: Create a manual migration to sync state

### Merge Conflicts in Migrations

If multiple developers create migrations:

1. Use `alembic merge` to create a merge migration:
   ```bash
   alembic merge -m "Merge migrations" <rev1> <rev2>
   ```

2. Or manually edit migration files to resolve conflicts

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in staging environment
- [ ] Database backup created
- [ ] Downgrade path tested
- [ ] Migration time estimated
- [ ] Maintenance window scheduled (if needed)

### Deployment Steps

1. **Backup database**:
   ```bash
   pg_dump -h $POSTGRES_SERVER -U $POSTGRES_USER $POSTGRES_DB > backup.sql
   ```

2. **Apply migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Verify success**:
   ```bash
   alembic current
   # Should show the latest revision
   ```

4. **Test application**:
   - Verify API endpoints work
   - Check data integrity
   - Test critical user flows

### Rollback Plan

If migration fails:

1. **Rollback migration**:
   ```bash
   alembic downgrade -1
   ```

2. **Restore from backup** (if needed):
   ```bash
   psql -h $POSTGRES_SERVER -U $POSTGRES_USER $POSTGRES_DB < backup.sql
   ```

## Kubernetes Deployment

For Kubernetes deployments, migrations should run as an init container or Job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: scouting-outing-migrations
spec:
  template:
    spec:
      containers:
      - name: migrations
        image: scouting-outing-backend:latest
        command: ["alembic", "upgrade", "head"]
        env:
        - name: POSTGRES_SERVER
          valueFrom:
            configMapKeyRef:
              name: scouting-outing-config
              key: postgres-server
        # ... other env vars
      restartPolicy: OnFailure
```

Run before deploying the application:

```bash
kubectl apply -f k8s/migrations-job.yaml
kubectl wait --for=condition=complete job/scouting-outing-migrations
kubectl apply -f k8s/backend-deployment.yaml
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check the migration history: `alembic history`
2. Review the generated migration files
3. Check application logs for errors
4. Consult the Alembic documentation
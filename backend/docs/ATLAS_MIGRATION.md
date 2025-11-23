# Atlas Migration Guide

This project uses [Atlas](https://atlasgo.io/) for database schema management instead of Alembic.

## Prerequisites

- Atlas CLI installed (via Homebrew: `brew install ariga/tap/atlas`)
- Docker running (for dev database)

## Workflow

### 1. Update SQLAlchemy Models

Make changes to your models in `app/models/`.

### 2. Generate Schema

Run the schema dump script to update `schema.sql`:

```bash
../.venv/bin/python tools/dump_schema.py > schema.sql
```

### 3. Generate Migration

Create a new migration based on the updated schema:

```bash
atlas migrate diff <migration_name> --env sqlalchemy
```

Example:
```bash
atlas migrate diff add_user_preferences --env sqlalchemy
```

### 4. Review Migration

Check the generated migration file in `migrations/`:

```bash
cat migrations/<timestamp>_<migration_name>.sql
```

### 5. Apply Migration

Apply migrations to your database:

```bash
atlas migrate apply --env sqlalchemy --url "postgresql://user:pass@localhost:5432/dbname"
```

Or use the connection string from your `.env` file.

## Common Commands

### Check migration status
```bash
atlas migrate status --env sqlalchemy --url "postgresql://..."
```

### Validate migrations
```bash
atlas migrate validate --env sqlalchemy
```

### Generate migration hash
```bash
atlas migrate hash --env sqlalchemy
```

## Configuration

The Atlas configuration is in `atlas.hcl`. It uses:
- `schema.sql` as the source of truth (generated from SQLAlchemy models)
- `migrations/` directory for migration files
- Docker PostgreSQL 15 as the dev database

## Comparison with Alembic

| Feature | Alembic | Atlas |
|---------|---------|-------|
| Auto-generation | ✓ | ✓ |
| Declarative | ✗ | ✓ |
| Visualization | ✗ | ✓ |
| Modern CLI | ✗ | ✓ |
| Learning curve | Medium | Low |

## Troubleshooting

### "Docker not running"
Start Docker Desktop before running `atlas migrate diff`.

### "Syntax error in schema.sql"
Regenerate the schema file:
```bash
../.venv/bin/python tools/dump_schema.py > schema.sql
```

### "Migration already exists"
Use a different migration name or delete the existing migration file.

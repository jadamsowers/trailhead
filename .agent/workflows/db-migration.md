---
description: How to manage database migrations using Atlas
---

# Database Migration Workflow (Atlas)

This project uses [Atlas](https://atlasgo.io) for database schema management.

## 1. Make Schema Changes

Modify the SQLAlchemy models in `backend/app/models/`.

## 2. Generate Migration

Run the following command to generate a new migration file based on your model changes:

```bash
# Run from project root
docker-compose exec backend atlas migrate diff <migration_name> --env sqlalchemy
```

Replace `<migration_name>` with a descriptive name (e.g., `add_user_profile`).

## 3. Apply Migration

Apply the pending migrations to the database:

```bash
# Run from project root
docker-compose exec backend atlas migrate apply --env sqlalchemy
```

## 4. Check Status

Check the status of migrations:

```bash
docker-compose exec backend atlas migrate status --env sqlalchemy
```

## 5. Reset Database (Destructive)

To completely wipe the database and start fresh (useful for development):

```bash
./backend/scripts/clean_database.sh
```

## 6. Reset Migrations (Preserve Data)

To clear migration history and re-baseline (advanced):

```bash
./backend/scripts/reset_migrations.sh
```

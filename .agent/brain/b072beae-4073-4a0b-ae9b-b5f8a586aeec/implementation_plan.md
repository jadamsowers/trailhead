# Implementation Plan - Switch to Atlas

## Goal
Remove all traces of Alembic from the project and standardize on Atlas for database schema management. This ensures a single, modern workflow for database migrations and schema versioning.

## Proposed Changes

### 1. Cleanup
-   **Delete**: `backend/alembic.ini`
-   **Update**: `backend/requirements.txt` (remove `alembic`)

### 2. Script Updates
-   **`backend/scripts/clean_database.sh`**: Replace Alembic commands with Atlas commands (e.g., `atlas schema clean`).
-   **`backend/scripts/reset_migrations.sh`**: Update to use Atlas for re-initializing migrations.

### 3. Documentation
-   **`backend/docs/QUICKSTART.md`**: Update the "Database Setup" section to reference Atlas commands.
-   **New Workflow**: Create `.agent/workflows/db-migration.md` to document the standard Atlas workflow for the user and future agents.

## Verification Plan
1.  **Manual Verification**: Run the updated scripts (`clean_database.sh`, `reset_migrations.sh`) to ensure they work with the running container.
2.  **Documentation Check**: Verify that the new workflow document is clear and accurate.

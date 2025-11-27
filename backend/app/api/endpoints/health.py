from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.db.session import AsyncSessionLocal
from app.models import User, Outing
import logging

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint - checks DB connectivity, tables, and migration status."""
    db_status = "unknown"
    tables_present = False
    migrations_up_to_date = False
    error = None
    latest_migration = None
    try:
        async with AsyncSessionLocal() as session:
            # Check DB connection
            await session.execute(text("SELECT 1"))
            db_status = "ok"
            # Check for at least one expected table (users)
            result = await session.execute(text("SELECT to_regclass('public.users')"))
            table_exists = result.scalar()
            tables_present = bool(table_exists)
            # Check latest migration (Atlas: check atlas_schema_revisions table)
            migration_result = await session.execute(text('SELECT version FROM "atlas_schema_revisions"."atlas_schema_revisions" ORDER BY executed_at DESC LIMIT 1'))
            latest_migration = migration_result.scalar()
            # Compare with latest migration in atlas.sum
            # Compare with latest migration in atlas.sum
            import os
            from pathlib import Path
            
            # Find migrations directory relative to this file
            # health.py is in app/api/endpoints/
            # migrations is in backend/migrations/ (sibling of app)
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            atlas_sum_path = base_dir / "migrations" / "atlas.sum"
            
            # Fallback for Docker container structure if different
            if not atlas_sum_path.exists():
                atlas_sum_path = Path("/app/migrations/atlas.sum")

            if atlas_sum_path.exists():
                with open(atlas_sum_path) as f:
                    lines = [l for l in f if l.strip() and l.strip()[0] != 'h']
                    if lines:
                        last_line = lines[-1]
                        file_version = last_line.split()[0]
                        migrations_up_to_date = (latest_migration and file_version.startswith(str(latest_migration)))
                        if not migrations_up_to_date:
                            print(f"Migration mismatch: DB={latest_migration}, File={file_version}")
            else:
                print(f"atlas.sum not found at {atlas_sum_path}")
    except SQLAlchemyError as e:
        db_status = "error"
        error = str(e)
    except Exception as e:
        db_status = "error"
        error = str(e)
    health = {
        "status": "healthy" if db_status == "ok" and tables_present and migrations_up_to_date else "unhealthy",
        "db_status": db_status,
        "tables_present": tables_present,
        "migrations_up_to_date": migrations_up_to_date,
        "latest_migration": latest_migration,
        "error": error,
    }
    status_code = status.HTTP_200_OK if health["status"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(content=health, status_code=status_code)


@router.get("/ready", tags=["health"])
async def readiness_check():
    """Readiness check endpoint - returns 200 if DB and tables are ready, 503 otherwise."""
    db_status = "unknown"
    tables_present = False
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_status = "ok"
            result = await session.execute(text("SELECT to_regclass('public.users')"))
            table_exists = result.scalar()
            tables_present = bool(table_exists)
    except Exception:
        db_status = "error"
    ready = db_status == "ok" and tables_present
    status_code = status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(content={"status": "ready" if ready else "not ready"}, status_code=status_code)

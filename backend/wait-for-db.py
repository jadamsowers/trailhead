#!/usr/bin/env python3
"""Wait for database to be ready before starting the application."""
import time
import sys
import asyncpg
from app.core.config import settings

async def wait_for_db(max_retries=60, retry_interval=10):
    """Wait for database to be ready."""
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempting to connect to database... (attempt {attempt}/{max_retries})")
            # Try to connect to the database
            conn = await asyncpg.connect(
                host=settings.POSTGRES_SERVER,
                port=settings.POSTGRES_PORT,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                database=settings.POSTGRES_DB,
                timeout=10
            )
            await conn.close()
            print("✅ Database is ready!")
            return True
        except Exception as e:
            print(f"⏳ Database not ready yet: {e}")
            if attempt < max_retries:
                print(f"Waiting {retry_interval} seconds before retry...")
                time.sleep(retry_interval)
            else:
                print("❌ Failed to connect to database after maximum retries")
                return False
    return False

if __name__ == "__main__":
    import asyncio
    success = asyncio.run(wait_for_db())
    sys.exit(0 if success else 1)
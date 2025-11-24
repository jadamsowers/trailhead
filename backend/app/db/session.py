from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator
import os

from app.core.config import settings

# Choose database URL; for tests we avoid requiring asyncpg if TESTING env is set.
if os.getenv("TESTING"):
    _database_url = "sqlite+aiosqlite:///:memory:"
else:
    _database_url = settings.DATABASE_URL

if _database_url.startswith("sqlite+aiosqlite"):
    engine = create_async_engine(
        _database_url,
        echo=settings.DEBUG,
        future=True,
    )
else:
    engine = create_async_engine(
        _database_url,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    Yields an async session and ensures it's closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
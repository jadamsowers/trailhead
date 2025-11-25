"""Pytest configuration and fixtures for backend tests"""
import pytest
import asyncio
import os
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from httpx import AsyncClient
from datetime import datetime, date, timedelta
import uuid

# Set test environment variables before importing app
os.environ["POSTGRES_SERVER"] = "localhost"
os.environ["POSTGRES_USER"] = "test"
os.environ["POSTGRES_PASSWORD"] = "test"
os.environ["POSTGRES_DB"] = "test"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_min_32_chars_long"
os.environ["BACKEND_CORS_ORIGINS"] = "http://localhost:3000"
os.environ["TESTING"] = "1"

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_password_hash, create_access_token


# Test database URL selection:
# Prefer an explicitly provided Postgres URL (DATABASE_URL or TEST_DATABASE_URL env var)
# so that Postgres-specific types (e.g. ARRAY) are supported. Fall back to in-memory
# SQLite for fast lightweight tests when no URL is supplied.
TEST_DATABASE_URL = (
    os.getenv("TEST_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or "sqlite+aiosqlite:///:memory:"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session"""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test admin user"""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_token(test_user: User) -> str:
    """Create a test JWT token for the test user"""
    return create_access_token(
        data={"sub": str(test_user.id), "role": test_user.role}
    )


@pytest.fixture
async def auth_headers(test_user_token: str) -> dict:
    """Create authorization headers with test token"""
    return {"Authorization": f"Bearer {test_user_token}"}


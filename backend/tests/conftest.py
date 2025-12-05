"""Pytest configuration and fixtures for backend tests"""
import pytest
import asyncio
import os
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool, StaticPool
from httpx import AsyncClient, ASGITransport
from datetime import datetime, date, timedelta
import uuid
from pathlib import Path


def load_credentials():
    """Load database credentials from credentials.txt or use defaults for SQLite testing"""
    credentials_file = Path(__file__).parent.parent.parent / "credentials.txt"
    
    # Default credentials for testing (SQLite or when credentials.txt is missing)
    creds = {
        "user": "testuser",
        "password": "testpassword",
        "database": "testdb",
        "port": "5432",
        "secret_key": "test_secret_key_for_testing_only_do_not_use_in_production",
        "authentik_client_id": "test_authentik_client_id",
        "authentik_client_secret": "test_authentik_client_secret",
    }
    
    if credentials_file.exists():
        with open(credentials_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith("PostgreSQL User:"):
                    creds["user"] = line.split(":", 1)[1].strip()
                elif line.startswith("PostgreSQL Password:"):
                    creds["password"] = line.split(":", 1)[1].strip()
                elif line.startswith("PostgreSQL Database:"):
                    creds["database"] = line.split(":", 1)[1].strip()
                elif line.startswith("PostgreSQL Port:"):
                    creds["port"] = line.split(":", 1)[1].strip()
                elif line.startswith("Secret Key:"):
                    creds["secret_key"] = line.split(":", 1)[1].strip()
                elif line.startswith("Authentik Client ID:"):
                    creds["authentik_client_id"] = line.split(":", 1)[1].strip()
                elif line.startswith("Authentik Client Secret:"):
                    creds["authentik_client_secret"] = line.split(":", 1)[1].strip()
    
    return creds


# Load credentials from credentials.txt
creds = load_credentials()

# Set test environment variables before importing app
os.environ["POSTGRES_SERVER"] = "localhost"
os.environ["POSTGRES_USER"] = creds["user"]
os.environ["POSTGRES_PASSWORD"] = creds["password"]
# CRITICAL: Use a separate test database to avoid destroying production data!
os.environ["POSTGRES_DB"] = creds["database"] + "_test"  # Add _test suffix
os.environ["POSTGRES_PORT"] = creds["port"]
os.environ["SECRET_KEY"] = creds["secret_key"]
os.environ["AUTHENTIK_URL"] = "http://localhost:9000"
os.environ["AUTHENTIK_CLIENT_ID"] = creds["authentik_client_id"]
os.environ["AUTHENTIK_CLIENT_SECRET"] = creds["authentik_client_secret"]
os.environ["BACKEND_CORS_ORIGINS"] = "http://localhost:3000"
os.environ["TESTING"] = "1"

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.core.security import create_access_token
from app.models import (
    Outing,
    Signup,
    Participant,
    FamilyMember,
    RefreshToken,
    CheckIn,
    Place,
    RankRequirement,
    MeritBadge,
    OutingRequirement,
    OutingMeritBadge,
    PackingListTemplate,
    PackingListTemplateItem,
    OutingPackingList,
    OutingPackingListItem,
    Troop,
    Patrol,
)
from app.models.troop import Troop, Patrol


def _check_postgres_available():
    """Check if PostgreSQL is available for testing"""
    import socket
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', int(creds["port"])))
        sock.close()
        return result == 0
    except Exception:
        return False


# Use SQLite for testing when PostgreSQL is not available
USE_SQLITE = not _check_postgres_available()

if USE_SQLITE:
    TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
else:
    # Build PostgreSQL connection URL from credentials
    # CRITICAL: Use separate test database!
    TEST_DATABASE_URL = (
        f"postgresql+asyncpg://{creds['user']}:{creds['password']}"
        f"@localhost:{creds['port']}/{creds['database']}_test"  # Add _test suffix
    )


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


async def ensure_test_database_exists():
    """Create test database if it doesn't exist (PostgreSQL only)."""
    if USE_SQLITE:
        # SQLite in-memory database doesn't need setup
        return
    
    import asyncpg
    
    # Connect to default 'postgres' database to create test database
    try:
        conn = await asyncpg.connect(
            user=creds["user"],
            password=creds["password"],
            host="localhost",
            port=creds["port"],
            database="postgres"  # Connect to default database
        )
        
        # Check if test database exists
        test_db_name = f"{creds['database']}_test"
        result = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            test_db_name
        )
        
        if not result:
            # Create test database
            await conn.execute(f'CREATE DATABASE "{test_db_name}"')
            print(f"✅ Created test database: {test_db_name}")
        else:
            print(f"✅ Test database already exists: {test_db_name}")
        
        await conn.close()
    except Exception as e:
        print(f"⚠️  Warning: Could not create test database: {e}")
        print(f"   Please create it manually: createdb {creds['database']}_test")
        raise


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Ensure test database exists before running any tests."""
    await ensure_test_database_exists()


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine"""
    if USE_SQLITE:
        engine = create_async_engine(
            TEST_DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
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
    """Create a test client with database session override (no auth)"""
    from app.api import deps
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def authenticated_client(db_session: AsyncSession, test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with mocked authentication"""
    from app.api import deps
    
    async def override_get_db():
        yield db_session
    
    async def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[deps.get_current_user] = override_get_current_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test admin user"""
    from app.core.security import get_password_hash
    
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
async def test_regular_user(db_session: AsyncSession) -> User:
    """Create a test regular user"""
    from app.core.security import get_password_hash
    
    user = User(
        id=uuid.uuid4(),
        email="user@test.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        role="user",
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
        data={"sub": str(test_user.id), "role": test_user.role, "iss": "https://test.authentik.local"}
    )


@pytest.fixture
async def test_regular_user_token(test_regular_user: User) -> str:
    """Create a test JWT token for the regular user"""
    return create_access_token(
        data={"sub": str(test_regular_user.id), "role": test_regular_user.role, "iss": "https://test.authentik.local"}
    )


@pytest.fixture
async def auth_headers(test_user: User, client) -> dict:
    """Create authorization headers with test token - also setup mocked auth for this user"""
    from app.api import deps
    from unittest.mock import AsyncMock, patch
    
    async def mock_get_current_user():
        return test_user
    
    # Override get_current_user to return test_user
    app.dependency_overrides[deps.get_current_user] = mock_get_current_user
    
    # Return headers (though they won't be validated due to the override)
    return {"Authorization": f"Bearer mock-token-admin"}


@pytest.fixture
async def regular_user_headers(test_regular_user: User, client) -> dict:
    """Create authorization headers with regular user token - also setup mocked auth for this user"""
    from app.api import deps
    
    async def mock_get_current_user():
        return test_regular_user
    
    # Override get_current_user to return test_regular_user
    app.dependency_overrides[deps.get_current_user] = mock_get_current_user
    
    # Return headers (though they won't be validated due to the override)
    return {"Authorization": f"Bearer mock-token-user"}


# ===== Outing Fixtures =====

@pytest.fixture
async def test_outing(db_session: AsyncSession):
    """Create a test outing"""
    from app.models.outing import Outing
    
    outing = Outing(
        id=uuid.uuid4(),
        name="Test Outing",
        outing_date=date.today() + timedelta(days=30),
        end_date=date.today() + timedelta(days=32),
        location="Test Location",
        description="Test outing description",
        max_participants=20,
        is_overnight=True,
    )
    db_session.add(outing)
    await db_session.commit()
    await db_session.refresh(outing)
    return outing


@pytest.fixture
async def test_day_outing(db_session: AsyncSession):
    """Create a test day outing (no overnight)"""
    from app.models.outing import Outing
    
    outing = Outing(
        id=uuid.uuid4(),
        name="Test Day Outing",
        outing_date=date.today() + timedelta(days=20),
        end_date=None,
        location="Day Outing Location",
        description="Day outing description",
        max_participants=15,
        is_overnight=False,
    )
    db_session.add(outing)
    await db_session.commit()
    await db_session.refresh(outing)
    return outing


@pytest.fixture
def sample_outing_data() -> dict:
    """Sample outing data for create/update tests"""
    return {
        "name": "Sample Camping Trip",
        "outing_date": (date.today() + timedelta(days=30)).isoformat(),
        "end_date": (date.today() + timedelta(days=32)).isoformat(),
        "location": "Sample Campground",
        "description": "A great camping trip for scouts",
        "max_participants": 25,
        "is_overnight": True,
    }


# ===== Signup Fixtures =====

@pytest.fixture
async def test_signup(db_session: AsyncSession, test_outing, test_user, test_family_member):
    """Create a test signup with participants"""
    from app.models.signup import Signup
    from app.models.participant import Participant
    from app.models.family import FamilyMember
    from datetime import date, timedelta
    
    # Create an adult family member for the signup
    adult_member = FamilyMember(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Adult",
        member_type="adult",
        date_of_birth=date.today() - timedelta(days=365*40),
        gender="male",
        troop_number="100",
        has_youth_protection=True,
        vehicle_capacity=5,
    )
    db_session.add(adult_member)
    await db_session.flush()
    
    signup = Signup(
        id=uuid.uuid4(),
        outing_id=test_outing.id,
        family_contact_name="Test Family",
        family_contact_email="family@test.com",
        family_contact_phone="555-1234",
    )
    db_session.add(signup)
    await db_session.flush()
    
    # Add a scout participant (using existing test_family_member fixture)
    scout = Participant(
        id=uuid.uuid4(),
        signup_id=signup.id,
        family_member_id=test_family_member.id,
    )
    db_session.add(scout)
    
    # Add an adult participant
    adult = Participant(
        id=uuid.uuid4(),
        signup_id=signup.id,
        family_member_id=adult_member.id,
    )
    db_session.add(adult)
    
    await db_session.commit()
    await db_session.refresh(signup)
    return signup


@pytest.fixture
def sample_signup_data(test_outing) -> dict:
    """Sample signup data for create tests"""
    return {
        "outing_id": str(test_outing.id),
        "family_contact": {
            "name": "Sample Family",
            "email": "sample@test.com",
            "phone": "555-5555",
        },
        "participants": [
            {
                "name": "Sample Scout",
                "age": 13,
                "participant_type": "scout",
                "is_adult": False,
                "gender": "male",
                "troop_number": "100",
                "patrol_name": "Eagle Patrol",
                "has_youth_protection": False,
                "vehicle_capacity": 0,
                "dietary_restrictions": [],
                "allergies": [],
                "medical_notes": None,
            },
            {
                "name": "Sample Parent",
                "age": 42,
                "participant_type": "adult",
                "is_adult": True,
                "gender": "male",
                "has_youth_protection": True,
                "vehicle_capacity": 5,
                "dietary_restrictions": [],
                "allergies": [],
                "medical_notes": None,
            }
        ]
    }


# ===== Place Fixtures =====

@pytest.fixture
async def test_place(db_session: AsyncSession):
    """Create a test place"""
    from app.models.place import Place
    
    place = Place(
        id=uuid.uuid4(),
        name="Test Campground",
        address="123 Camp Road, Woods, ST 12345",
    )
    db_session.add(place)
    await db_session.commit()
    await db_session.refresh(place)
    return place

# ===== Troop & Patrol Fixtures =====

@pytest.fixture
async def test_troop(db_session: AsyncSession):
    """Create a test troop"""
    troop = Troop(
        id=uuid.uuid4(),
        number="123",
        charter_org="Test Charter Org",
        meeting_location="Community Center",
        meeting_day="Tuesday",
    )
    db_session.add(troop)
    await db_session.commit()
    await db_session.refresh(troop)
    return troop

@pytest.fixture
async def test_patrol(db_session: AsyncSession, test_troop: Troop):
    """Create a test patrol"""
    patrol = Patrol(
        id=uuid.uuid4(),
        troop_id=test_troop.id,
        name="Eagle Patrol",
        is_active=True,
    )
    db_session.add(patrol)
    await db_session.commit()
    await db_session.refresh(patrol)
    return patrol


# ===== Family Member Fixtures =====

@pytest.fixture
async def test_family_member(db_session: AsyncSession, test_user):
    """Create a test family member"""
    from app.models.family import FamilyMember
    from datetime import date, timedelta
    
    member = FamilyMember(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Scout Member",
        date_of_birth=date.today() - timedelta(days=365*14),
        member_type="scout",
        gender="male",
        troop_number="100",
    )
    db_session.add(member)
    await db_session.commit()
    await db_session.refresh(member)
    return member


# ===== Requirement Fixtures =====

@pytest.fixture
async def test_rank_requirement(db_session: AsyncSession):
    """Create a test rank requirement"""
    from app.models.requirement import RankRequirement
    
    requirement = RankRequirement(
        id=uuid.uuid4(),
        rank="Tenderfoot",
        requirement_number="1a",
        requirement_text="Test camping requirement",
        keywords=["camping", "overnight"],
        category="Camping",
    )
    db_session.add(requirement)
    await db_session.commit()
    await db_session.refresh(requirement)
    return requirement


@pytest.fixture
async def test_merit_badge(db_session: AsyncSession):
    """Create a test merit badge"""
    from app.models.requirement import MeritBadge
    
    badge = MeritBadge(
        id=uuid.uuid4(),
        name="Camping",
        description="Test camping merit badge",
        keywords=["camping", "outdoor"],
    )
    db_session.add(badge)
    await db_session.commit()
    await db_session.refresh(badge)
    return badge

@pytest.fixture
async def test_participant(db_session: AsyncSession, test_signup: Signup):
    """Get a participant from the test signup"""
    # test_signup creates 2 participants (scout and adult)
    # We'll fetch one
    from sqlalchemy import select
    result = await db_session.execute(select(Participant).where(Participant.signup_id == test_signup.id))
    participant = result.scalars().first()
    return participant

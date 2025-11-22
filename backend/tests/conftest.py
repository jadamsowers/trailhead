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

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.outing import Outing
from app.models.signup import Signup
from app.models.participant import Participant, DietaryRestriction, Allergy
from app.core.security import get_password_hash, create_access_token


# Test database URL - using in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


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


@pytest.fixture
async def test_outing(db_session: AsyncSession) -> Outing:
    """Create a test outing"""
    outing = Outing(
        id=uuid.uuid4(),
        name="Test Camping Outing",
        outing_date=date.today() + timedelta(days=30),
        end_date=date.today() + timedelta(days=32),
        location="Test Campground",
        description="A test camping outing",
        max_participants=20,
        is_overnight=True,
    )
    db_session.add(outing)
    await db_session.commit()
    await db_session.refresh(outing)
    return outing


@pytest.fixture
async def test_day_outing(db_session: AsyncSession) -> Outing:
    """Create a test day outing"""
    outing = Outing(
        id=uuid.uuid4(),
        name="Test Day Hike",
        outing_date=date.today() + timedelta(days=15),
        end_date=None,
        location="Test Trail",
        description="A test day hike",
        max_participants=15,
        is_overnight=False,
    )
    db_session.add(outing)
    await db_session.commit()
    await db_session.refresh(outing)
    return outing


@pytest.fixture
async def test_signup(db_session: AsyncSession, test_outing: Outing) -> Signup:
    """Create a test signup with participants"""
    signup = Signup(
        id=uuid.uuid4(),
        outing_id=test_outing.id,
        family_contact_name="John Doe",
        family_contact_email="john@example.com",
        family_contact_phone="555-1234",
    )
    db_session.add(signup)
    await db_session.flush()
    
    # Add scout participant
    scout = Participant(
        id=uuid.uuid4(),
        signup_id=signup.id,
        name="Scout Doe",
        age=14,
        participant_type="scout",
        is_adult=False,
        gender="male",
        troop_number="123",
        patrol_name="Eagle Patrol",
        has_youth_protection=False,
        vehicle_capacity=0,
    )
    db_session.add(scout)
    
    # Add adult participant
    adult = Participant(
        id=uuid.uuid4(),
        signup_id=signup.id,
        name="John Doe",
        age=42,
        participant_type="adult",
        is_adult=True,
        gender="male",
        troop_number=None,
        patrol_name=None,
        has_youth_protection=True,
        vehicle_capacity=5,
    )
    db_session.add(adult)
    
    await db_session.commit()
    await db_session.refresh(signup)
    return signup


@pytest.fixture
async def test_participant_with_restrictions(db_session: AsyncSession, test_signup: Signup) -> Participant:
    """Create a test participant with dietary restrictions and allergies"""
    participant = Participant(
        id=uuid.uuid4(),
        signup_id=test_signup.id,
        name="Special Needs Scout",
        age=13,
        participant_type="scout",
        is_adult=False,
        gender="female",
        troop_number="456",
        patrol_name="Wolf Patrol",
        has_youth_protection=False,
        vehicle_capacity=0,
        medical_notes="Requires EpiPen",
    )
    db_session.add(participant)
    await db_session.flush()
    
    # Add dietary restrictions
    restriction1 = DietaryRestriction(
        id=uuid.uuid4(),
        participant_id=participant.id,
        restriction_type="vegetarian",
    )
    restriction2 = DietaryRestriction(
        id=uuid.uuid4(),
        participant_id=participant.id,
        restriction_type="gluten-free",
    )
    db_session.add(restriction1)
    db_session.add(restriction2)
    
    # Add allergies
    allergy1 = Allergy(
        id=uuid.uuid4(),
        participant_id=participant.id,
        allergy_type="peanuts",
    )
    allergy2 = Allergy(
        id=uuid.uuid4(),
        participant_id=participant.id,
        allergy_type="shellfish",
    )
    db_session.add(allergy1)
    db_session.add(allergy2)
    
    await db_session.commit()
    await db_session.refresh(participant)
    return participant


@pytest.fixture
def sample_signup_data(test_outing: Outing) -> dict:
    """Sample signup data for testing"""
    return {
        "outing_id": str(test_outing.id),
        "family_contact": {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "555-5678",
        },
        "participants": [
            {
                "name": "Scout Smith",
                "age": 12,
                "participant_type": "scout",
                "is_adult": False,
                "gender": "female",
                "troop_number": "789",
                "patrol_name": "Bear Patrol",
                "has_youth_protection": False,
                "vehicle_capacity": 0,
                "dietary_restrictions": ["vegetarian"],
                "allergies": [],
                "medical_notes": None,
            },
            {
                "name": "Jane Smith",
                "age": 38,
                "participant_type": "adult",
                "is_adult": True,
                "gender": "female",
                "troop_number": None,
                "patrol_name": None,
                "has_youth_protection": True,
                "vehicle_capacity": 4,
                "dietary_restrictions": [],
                "allergies": [],
                "medical_notes": None,
            },
        ],
    }


@pytest.fixture
def sample_outing_data() -> dict:
    """Sample outing data for testing"""
    return {
        "name": "Summer Camp 2026",
        "outing_date": (date.today() + timedelta(days=60)).isoformat(),
        "end_date": (date.today() + timedelta(days=67)).isoformat(),
        "location": "Camp Wilderness",
        "description": "Week-long summer camp adventure",
        "max_participants": 50,
        "is_overnight": True,
    }
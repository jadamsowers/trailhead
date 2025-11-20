"""
Script to create an initial admin user for the Scouting Outing Manager application.

Usage:
    python -m backend.scripts.create_admin

Or from the backend directory:
    python -m scripts.create_admin
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import uuid


async def create_initial_admin():
    """Create the initial admin user if it doesn't exist"""
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(
            select(User).where(User.email == "admin@scouttrips.com")
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("Admin user already exists!")
            print(f"Email: {existing_user.email}")
            print(f"Role: {existing_user.role}")
            return
        
        # Create new admin user
        admin = User(
            id=uuid.uuid4(),
            email="admin@scouttrips.com",
            hashed_password=get_password_hash("changeme123"),
            full_name="Admin User",
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"Email: {admin.email}")
        print(f"Password: changeme123")
        print(f"Role: {admin.role}")
        print("\n⚠️  IMPORTANT: Change the password after first login!")


if __name__ == "__main__":
    print("Creating initial admin user...")
    asyncio.run(create_initial_admin())
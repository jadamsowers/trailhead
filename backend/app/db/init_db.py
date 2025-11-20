"""
Database initialization script.

This script creates an initial admin user for the Scouting Outing Manager application.
Run this after applying Alembic migrations to set up the initial admin account.

Usage:
    python -m app.db.init_db
"""
import asyncio
import sys
from secrets import token_urlsafe
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User


async def init_db() -> None:
    """Initialize database with default admin user."""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
    )
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            # Get admin email and password from settings
            initial_admin_email = settings.INITIAL_ADMIN_EMAIL
            initial_admin_password = settings.INITIAL_ADMIN_PASSWORD
            
            # Generate random password if not provided in settings
            if not initial_admin_password:
                initial_admin_password = token_urlsafe(16)
            
            # Check if admin user already exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.email == initial_admin_email)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print("✓ Admin user already exists")
                print(f"  Email: {existing_user.email}")
                print(f"  Name: {existing_user.full_name}")
                return
            
            # Create default admin user
            admin_user = User(
                id=uuid4(),
                email=initial_admin_email,
                hashed_password=get_password_hash(initial_admin_password),
                full_name="System Administrator",
                role="admin",
                is_active=True,
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("\n" + "="*60)
            print("✓ Database initialized successfully!")
            print("="*60)
            print("\nDefault Admin User Created:")
            print(f"  Email: {admin_user.email}")
            print(f"  Password: {initial_admin_password}")
            if settings.INITIAL_ADMIN_PASSWORD:
                print("  (Password was set from INITIAL_ADMIN_PASSWORD environment variable)")
            else:
                print("  (Password was randomly generated - save this password!)")
            print(f"  Name: {admin_user.full_name}")
            print("\n⚠️  IMPORTANT: Change the admin password immediately after first login!")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"\n✗ Error initializing database: {e}", file=sys.stderr)
            await session.rollback()
            raise
        finally:
            await engine.dispose()


def main():
    """Main entry point for the initialization script."""
    try:
        asyncio.run(init_db())
    except KeyboardInterrupt:
        print("\n\nInitialization cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
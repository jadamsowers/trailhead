"""
Database initialization script.

This script verifies database connectivity and displays the configured admin email.

Usage:
    python -m app.db.init_db
"""
import asyncio
import sys

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

from app.core.config import settings


async def init_db() -> None:
    """Initialize database and display admin configuration."""
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
    )
    
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        print("\n" + "="*60)
        print("✓ Database connection successful!")
        print("="*60)
        print("\nℹ️  Admin Setup Instructions:")
        print("  1. Sign in with your Authentik account.")
        print("   a. Use the email: " + settings.INITIAL_ADMIN_EMAIL)
        print("   b. Use the password in credentials.txt")
        print("  ")
        print("  2. On first sign-in, you will automatically be granted admin role")
        print("="*60 + "\n")
        # Attempt to import default packing list templates (no-op if already present)
        try:
            import scripts.import_packing_lists as import_packing_lists

            print("\n📥 Checking packing-list templates and importing if missing...")
            try:
                await import_packing_lists.main()
            except Exception as e:
                print(f"⚠️  Packing list import encountered an error: {e}")
        except Exception as e:
            # If scripts module isn't available or import fails, just warn and continue
            print(f"⚠️  Could not run packing list import script: {e}")
        
    except Exception as e:
        print(f"\n✗ Error connecting to database: {e}", file=sys.stderr)
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
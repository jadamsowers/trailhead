import asyncio
import asyncpg
from pathlib import Path

def load_credentials():
    credentials_file = Path("../credentials.txt")
    creds = {
        "user": "testuser",
        "password": "testpassword",
        "database": "testdb",
        "port": "5432",
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
    return creds

async def reset_db():
    creds = load_credentials()
    test_db_name = f"{creds['database']}_test"
    
    print(f"Connecting to postgres to drop {test_db_name}...")
    try:
        # Connect to default postgres DB
        conn = await asyncpg.connect(
            user=creds["user"],
            password=creds["password"],
            host="localhost",
            port=creds["port"],
            database="postgres"
        )
        
        # Terminate existing connections
        await conn.execute(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{test_db_name}'
            AND pid <> pg_backend_pid();
        """)
        
        print(f"Dropping database {test_db_name}...")
        await conn.execute(f'DROP DATABASE IF EXISTS "{test_db_name}"')
        print(f"✅ Database {test_db_name} dropped successfully.")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(reset_db())

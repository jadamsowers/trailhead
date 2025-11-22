# Scouting Outing Manager Backend - Quick Start Guide

Get the backend up and running in 5 minutes!

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip (Python package manager)

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
# Required variables:
# - POSTGRES_SERVER (e.g., localhost)
# - POSTGRES_USER (e.g., scoutoutings)
# - POSTGRES_PASSWORD (your secure password)
# - POSTGRES_DB (e.g., scouting_outing_manager)
# - SECRET_KEY (generate with: openssl rand -hex 32)
#
# Optional variables for initial admin user:
# - INITIAL_ADMIN_EMAIL (default: soadmin@scouthacks.net)
# - INITIAL_ADMIN_PASSWORD (if not set, a random password will be generated)
```

## Step 3: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE scouting_outing_manager;
CREATE USER scouting_outing WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scouting_outing_manager TO scouting_outing;
\q
```

## Step 4: Run Migrations

```bash
cd backend

# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations to create tables
alembic upgrade head
```

## Step 5: Seed Initial Data

```bash
cd backend

# Create default admin user
python -m app.db.init_db
```

**Admin User Configuration:**

The initial admin user credentials are configurable via environment variables:

1. **Set a specific password** (recommended for production):
   ```bash
   # Add to your .env file
   INITIAL_ADMIN_EMAIL=admin@yourdomain.com
   INITIAL_ADMIN_PASSWORD=your_secure_password_here
   ```

2. **Use defaults** (development/testing):
   - Email: `soadmin@scouthacks.net` (default, can be changed via `INITIAL_ADMIN_EMAIL`)
   - Password: Randomly generated and displayed in the terminal
   - **Save the generated password** - it will be shown in the terminal output!

**⚠️ IMPORTANT:** 
- If you don't set `INITIAL_ADMIN_PASSWORD`, a random password will be generated - make sure to save it!
- Change the admin password immediately after first login!

## Step 6: Start the Server

```bash
cd backend

# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Verify Installation

1. **Check API Health**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **View API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test Authentication**
   ```bash
   # Replace with your actual admin email and password
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=soadmin@scouthacks.net&password=YOUR_ADMIN_PASSWORD"
   ```
   
   Use the password you set in `INITIAL_ADMIN_PASSWORD` or the randomly generated password shown when you ran `init_db`.

## Common Commands

### Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Check current version
alembic current
```

### Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests (when implemented)
pytest

# Check code style
black app/
flake8 app/
```

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -h localhost -U scouting_outing -d scouting_outing_manager

# Check environment variables
echo $POSTGRES_SERVER
echo $POSTGRES_USER
```

### Migration Errors

```bash
# Check current state
alembic current

# View pending migrations
alembic history

# Reset database (development only!)
alembic downgrade base
alembic upgrade head
```

### Import Errors

```bash
# Ensure you're in the backend directory
cd backend

# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

## Next Steps

1. **Change Admin Password** - Use the API to update the default password
2. **Create Test Outing** - Use the admin interface to create a sample outing
3. **Test Signup Flow** - Create a test signup with participants
4. **Review Documentation** - Read MIGRATIONS.md for detailed migration guide
5. **Deploy** - See k8s-migration-job.yaml for Kubernetes deployment

## API Endpoints

### Public Endpoints
- `GET /api/outings` - List available outings
- `POST /api/signups` - Create signup with participants

### Admin Endpoints (require authentication)
- `POST /api/outings` - Create new outing
- `GET /api/outings/{id}/signups` - View outing signups
- `POST /api/csv/outings/{id}/import-roster` - Import roster CSV
- `GET /api/csv/outings/{id}/export-roster` - Export roster CSV

### Authentication Endpoints
- `POST /api/auth/login` - Login (get access token)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate refresh token)

## File Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   ├── env.py           # Alembic environment
│   └── README           # Migration instructions
├── app/
│   ├── api/             # API endpoints
│   ├── core/            # Core configuration
│   ├── crud/            # Database operations
│   ├── db/              # Database setup
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── main.py          # FastAPI application
├── alembic.ini          # Alembic configuration
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── MIGRATIONS.md        # Detailed migration guide
```

## Support

For detailed information:
- **Migrations**: See MIGRATIONS.md
- **Architecture**: See ../ARCHITECTURE.md
- **Security**: See ../SECURITY_AUTH.md
- **API Docs**: http://localhost:8000/docs (when running)
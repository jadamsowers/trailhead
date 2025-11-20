from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import trips, signups, csv_import, auth, oauth, registration, family

# Create FastAPI application with enhanced documentation
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## Scouting Outing Manager API

A comprehensive API for managing scout troop trips, signups, and participant information.

### Features

* **Trip Management** - Create and manage Scouting Outings with capacity tracking
* **Family Signups** - Register multiple scouts and adults per family
* **Scouting America Compliance** - Enforce two-deep leadership and youth protection requirements
* **Multi-Troop Support** - Track troop numbers and patrol assignments
* **CSV Import/Export** - Bulk roster management capabilities
* **Dietary Tracking** - Manage allergies and dietary restrictions
* **Adult Qualifications** - Track Scouting America training and transportation capacity

### Authentication

Most admin endpoints require JWT authentication. Use the `/api/auth/login` endpoint to obtain an access token.

### Getting Started

1. Create trips using the admin interface
2. Participants can view available trips and sign up
3. Admins can view signups and export rosters

For detailed documentation, see the individual endpoint descriptions below.
    """,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",
    contact={
        "name": "Scouting Outing Manager Support",
        "url": "https://github.com/jadamsowers/scouting-outing-manager",
    },
    license_info={
        "name": "MIT License",
    },
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    trips.router,
    prefix=f"{settings.API_V1_STR}/trips",
    tags=["trips"]
)

app.include_router(
    signups.router,
    prefix=f"{settings.API_V1_STR}/signups",
    tags=["signups"]
)

app.include_router(
    csv_import.router,
    prefix=f"{settings.API_V1_STR}/csv",
    tags=["csv-import-export"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"]
)

app.include_router(
    oauth.router,
    prefix=f"{settings.API_V1_STR}/oauth",
    tags=["oauth"]
)

app.include_router(
    registration.router,
    prefix=f"{settings.API_V1_STR}/register",
    tags=["registration"]
)

app.include_router(
    family.router,
    prefix=f"{settings.API_V1_STR}/family",
    tags=["family-management"]
)


@app.get("/")
async def root():
    """Root endpoint - provides API information and documentation links"""
    return {
        "message": "Scouting Outing Manager API",
        "version": settings.VERSION,
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "health": f"{settings.API_V1_STR}/health",
            "auth": f"{settings.API_V1_STR}/auth",
            "trips": f"{settings.API_V1_STR}/trips",
            "signups": f"{settings.API_V1_STR}/signups",
            "csv": f"{settings.API_V1_STR}/csv",
            "family": f"{settings.API_V1_STR}/family"
        }
    }


@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    """Health check endpoint - returns healthy status"""
    return {"status": "healthy"}


@app.get(f"{settings.API_V1_STR}/ready")
async def readiness_check():
    """Readiness check endpoint - verifies service is ready to accept requests"""
    # TODO: Add database connection check
    return {"status": "ready"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
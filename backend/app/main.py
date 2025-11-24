from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import logging

from app.core.config import settings
from app.api.endpoints import outings, signups, registration, family, clerk_auth
from app.api import checkin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application with enhanced documentation
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## Trailhead API

A comprehensive API for managing scout troop outings, signups, and participant information.

### Features

* **Outing Management** - Create and manage scouting outings with capacity tracking
* **Family Signups** - Register multiple scouts and adults per family
* **Scouting America Compliance** - Enforce two-deep leadership and youth protection requirements
* **Multi-Troop Support** - Track troop numbers and patrol assignments
* **PDF Export** - Export printable rosters for outing leaders
* **Dietary Tracking** - Manage allergies and dietary restrictions
* **Adult Qualifications** - Track Scouting America training and transportation capacity

### Authentication

Most admin endpoints require JWT authentication. Use the `/api/auth/login` endpoint to obtain an access token.

### Getting Started

1. Create outings using the admin interface
2. Participants can view available outings and sign up
3. Admins can view signups and export rosters

For detailed documentation, see the individual endpoint descriptions below.
    """,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    openapi_url="/openapi.json",
    contact={
        "name": "Trailhead Support",
        "url": "https://github.com/jadamsowers/trailhead",
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
    expose_headers=["*"],
)


# Global exception handlers to ensure CORS headers are always included
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with proper CORS headers"""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper CORS headers"""
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper CORS headers and detailed logging"""
    # Log the full traceback for debugging
    logger.error(f"Unhandled Exception: {type(exc).__name__}")
    logger.error(f"Error details: {str(exc)}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    
    # Return a proper 500 error with CORS headers
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error. Please check server logs for details.",
            "error_type": type(exc).__name__,
            "error_message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        },
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# Include routers
app.include_router(
    outings.router,
    prefix=f"{settings.API_V1_STR}/outings",
    tags=["outings"]
)

app.include_router(
    signups.router,
    prefix=f"{settings.API_V1_STR}/signups",
    tags=["signups"]
)

app.include_router(
    clerk_auth.router,
    prefix=f"{settings.API_V1_STR}/clerk",
    tags=["clerk-auth"]
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

app.include_router(
    checkin.router,
    prefix=f"{settings.API_V1_STR}/outings",
    tags=["check-in"]
)


@app.get("/")
async def root():
    """Root endpoint - provides API information and documentation links"""
    return {
        "message": "Trailhead API",
        "version": settings.VERSION,
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "health": f"{settings.API_V1_STR}/health",
            "clerk": f"{settings.API_V1_STR}/clerk",
            "outings": f"{settings.API_V1_STR}/outings",
            "signups": f"{settings.API_V1_STR}/signups",
            "family": f"{settings.API_V1_STR}/family"
        }
    }


@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    """Health check endpoint - returns healthy status"""
    return {"status": "healthy", "message": "Backend is running"}


@app.get(f"{settings.API_V1_STR}/ready")
async def readiness_check():
    """Readiness check endpoint - verifies service is ready to accept requests"""
    # TODO: Add database connection check
    return {"status": "ready"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
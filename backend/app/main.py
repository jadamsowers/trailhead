from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import logging
import uuid

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.endpoints import outings, signups, registration, family, clerk_auth, requirements, places, packing_lists, troops, offline, grubmaster, tenting
from app.api import checkin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

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

# Register rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Middleware to log incoming requests for monitoring
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests for monitoring"""
    logger.info(f"📨 Incoming request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    return response


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Prevent clickjacking attacks
    response.headers["X-Frame-Options"] = "DENY"
    
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Enable browser XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Content Security Policy
    # Allow self and Clerk domains for authentication
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.com; "
        "frame-src 'self' https://*.clerk.accounts.dev;"
    )
    
    # HTTPS enforcement (HSTS) - only in production
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # Permissions policy (formerly Feature-Policy)
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response


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
    """Handle all unhandled exceptions with proper CORS headers and secure logging"""
    # Generate unique error ID for support tracking
    error_id = str(uuid.uuid4())
    
    # Log detailed error server-side only with error ID
    logger.error(
        f"Error ID: {error_id} | Type: {type(exc).__name__} | "
        f"Path: {request.url.path} | Method: {request.method}"
    )
    logger.error(f"Error details: {str(exc)}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    
    # Return sanitized error to client (never expose internal details)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please contact support with the error ID if this persists.",
            "error_id": error_id
        },
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# Include routers

# Routers
app.include_router(outings.router, prefix=f"{settings.API_V1_STR}/outings", tags=["outings"])
app.include_router(signups.router, prefix=f"{settings.API_V1_STR}/signups", tags=["signups"])
app.include_router(clerk_auth.router, prefix=f"{settings.API_V1_STR}/clerk", tags=["clerk-auth"])
app.include_router(registration.router, prefix=f"{settings.API_V1_STR}/register", tags=["registration"])
app.include_router(family.router, prefix=f"{settings.API_V1_STR}/family", tags=["family-management"])
app.include_router(checkin.router, prefix=f"{settings.API_V1_STR}/outings", tags=["check-in"])
app.include_router(requirements.router, prefix=f"{settings.API_V1_STR}/requirements", tags=["requirements"])
app.include_router(places.router, prefix=f"{settings.API_V1_STR}", tags=["places"])
app.include_router(packing_lists.router, prefix=f"{settings.API_V1_STR}/packing-lists", tags=["packing-lists"])
app.include_router(troops.router, prefix=f"{settings.API_V1_STR}", tags=["troops"])
app.include_router(offline.router, prefix=f"{settings.API_V1_STR}/offline", tags=["offline"])
app.include_router(grubmaster.router, prefix=f"{settings.API_V1_STR}/outings", tags=["grubmaster"])
app.include_router(tenting.router, prefix=f"{settings.API_V1_STR}/outings", tags=["tenting"])

# Health endpoint
from app.api.endpoints import health
app.include_router(health.router, prefix=f"{settings.API_V1_STR}")



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







if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
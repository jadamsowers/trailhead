# Additional Security Recommendations

**Status:** Optional improvements for enhanced security posture  
**Priority:** Medium (implement when convenient)

---

## 1. Config Validation (15 minutes)

Add validators to prevent starting with insecure defaults.

**File:** `backend/app/core/config.py`

Add these validators to the `Settings` class:

```python
@field_validator('CLERK_SECRET_KEY')
@classmethod
def validate_clerk_secret(cls, v):
    if v == "sk_test_your_clerk_secret_key_here":
        raise ValueError(
            "CLERK_SECRET_KEY not configured. Set in backend/.env file. "
            "Get your keys from https://dashboard.clerk.com"
        )
    return v

@field_validator('CLERK_PUBLISHABLE_KEY')
@classmethod
def validate_clerk_publishable(cls, v):
    if v == "pk_test_your_clerk_publishable_key_here":
        raise ValueError(
            "CLERK_PUBLISHABLE_KEY not configured. Set in backend/.env file."
        )
    return v

@field_validator('SECRET_KEY')
@classmethod
def validate_secret_key(cls, v):
    if "your_secret_key_here" in v.lower():
        raise ValueError(
            "SECRET_KEY not configured. Generate with: openssl rand -hex 32"
        )
    if len(v) < 32:
        raise ValueError("SECRET_KEY must be at least 32 characters long")
    return v

@field_validator('DEBUG')
@classmethod
def warn_debug_mode(cls, v):
    if v:
        import warnings
        warnings.warn("DEBUG mode is enabled. Disable for production!")
    return v
```

**Benefit:** Server won't start with insecure configuration.

---

## 2. Rate Limit Public Endpoints (10 minutes)

Add rate limiting to prevent scraping and abuse of public endpoints.

**File:** `backend/app/api/endpoints/outings.py`

```python
# At the top with other imports
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Update public endpoints
@router.get("/available", response_model=OutingListResponse)
@limiter.limit("60/minute")
async def get_available_outings(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # ... existing code

@router.get("", response_model=OutingListResponse)
@limiter.limit("60/minute")
async def get_all_outings(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    # ... existing code

@router.get("/{outing_id}", response_model=OutingResponse)
@limiter.limit("100/minute")
async def get_outing(
    request: Request,
    outing_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # ... existing code
```

---

## 3. Add Health Check Authentication (5 minutes)

Optionally protect detailed health endpoint.

**File:** `backend/app/api/endpoints/health.py`

```python
# Add a public basic health check
@router.get("/health/status")
async def health_status():
    """Basic health check - no details"""
    return {"status": "ok"}

# Protect detailed health with auth
@router.get("/health/detailed")
async def detailed_health(
    current_user: User = Depends(get_current_admin_user),
    session: AsyncSession = Depends(get_db)
):
    """Detailed health check - admin only"""
    # ... existing detailed health check code
```

---

## 4. Implement Request Size Limits (10 minutes)

Prevent memory exhaustion from large payloads.

**Option A - Nginx (Recommended for production):**

```nginx
# In nginx.conf
client_max_body_size 10M;
```

**Option B - FastAPI Middleware:**

```python
# In app/main.py
from starlette.middleware.base import BaseHTTPMiddleware

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next):
        if request.headers.get("content-length"):
            content_length = int(request.headers["content-length"])
            if content_length > self.max_size:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large"}
                )
        return await call_next(request)

# Add to app
app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)
```

---

## 5. Structured Audit Logging (30 minutes)

Log security-relevant events for compliance and forensics.

**Create:** `backend/app/utils/audit_log.py`

```python
import logging
import json
from datetime import datetime
from typing import Optional

audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# File handler for audit logs
handler = logging.FileHandler("logs/audit.log")
handler.setFormatter(logging.Formatter('%(message)s'))
audit_logger.addHandler(handler)

def log_security_event(
    event_type: str,
    user_id: Optional[str],
    details: dict,
    ip_address: Optional[str] = None
):
    """Log security-relevant events"""
    audit_logger.info(json.dumps({
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "details": details
    }))
```

**Usage examples:**

```python
# In clerk_auth.py
from app.utils.audit_log import log_security_event

@router.patch("/users/{user_id}/role", ...)
async def update_user_role(...):
    # ... existing code
    log_security_event(
        "ROLE_CHANGE",
        str(current_user.id),
        {
            "target_user": user_id,
            "old_role": target_user.role,
            "new_role": request.role
        },
        request.client.host if request.client else None
    )
    # ... rest of code

# In signups.py
@router.delete("/{signup_id}", ...)
async def cancel_signup(...):
    log_security_event(
        "SIGNUP_CANCELLED",
        str(current_user.id),
        {"signup_id": str(signup_id)},
        request.client.host if request.client else None
    )
    # ... existing code
```

---

## 6. Email Normalization for Admin (20 minutes)

Prevent email variation attacks on admin detection.

**File:** `backend/app/utils/email_utils.py` (new file)

```python
def normalize_email(email: str) -> str:
    """
    Normalize email for secure comparison.
    Handles Gmail dots, plus-addressing, and case.
    """
    email = email.lower().strip()
    
    try:
        local, domain = email.split('@')
    except ValueError:
        return email  # Invalid format, return as-is
    
    # Gmail/Google Workspace: remove dots and plus-addressing
    if domain in ['gmail.com', 'googlemail.com']:
        local = local.split('+')[0]  # Remove plus-addressing
        local = local.replace('.', '')  # Remove dots
    
    # For other providers, just handle plus-addressing
    else:
        local = local.split('+')[0]
    
    return f"{local}@{domain}"
```

**Usage in** `backend/app/api/deps.py`:

```python
from app.utils.email_utils import normalize_email

# In get_current_user function
normalized_email = normalize_email(email)
normalized_admin = normalize_email(settings.INITIAL_ADMIN_EMAIL)
is_initial_admin = normalized_email == normalized_admin
```

---

## 7. Dependency Scanning in CI/CD (15 minutes)

Automate security scanning on every commit.

**Create:** `.github/workflows/security.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r backend/requirements.txt
        pip install safety bandit
    
    - name: Run Safety check
      run: |
        cd backend
        safety check --json || true
    
    - name: Run Bandit
      run: |
        cd backend
        bandit -r app -f json -o bandit-report.json || true
        bandit -r app
    
    - name: Upload scan results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-reports
        path: |
          backend/bandit-report.json
```

**Local usage:**

```bash
cd backend
pip install safety bandit
safety check
bandit -r app
```

---

## 8. Session Timeout Monitoring (Optional)

Add middleware to track and enforce session timeouts.

**File:** `backend/app/middleware/session_monitor.py` (new file)

```python
from fastapi import Request
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# In-memory session tracking (consider Redis for production)
active_sessions = {}

async def track_session_activity(request: Request, call_next):
    """Track user session activity for timeout detection"""
    
    # Only track authenticated requests
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        token_hash = hash(token)  # Don't store actual token
        
        now = datetime.utcnow()
        last_activity = active_sessions.get(token_hash)
        
        # Check for session timeout (30 minutes)
        if last_activity and (now - last_activity) > timedelta(minutes=30):
            logger.warning(f"Session timeout detected")
            # Could force re-authentication here
        
        # Update last activity
        active_sessions[token_hash] = now
        
        # Cleanup old sessions (simple approach)
        if len(active_sessions) > 10000:
            cutoff = now - timedelta(hours=1)
            active_sessions.clear()  # Simple cleanup
    
    response = await call_next(request)
    return response
```

---

## Implementation Priority

### Immediate (Do First)
1. ✅ Config Validation (prevents misconfig)
2. ✅ Rate Limit Public Endpoints (prevents abuse)

### Soon (This Week)
3. Request Size Limits (prevents DoS)
4. Dependency Scanning (automation)

### When Time Permits
5. Audit Logging (compliance)
6. Email Normalization (edge case)
7. Health Check Auth (defense in depth)
8. Session Monitoring (if needed)

---

## Testing Checklist

- [ ] Config validation rejects invalid settings
- [ ] Public endpoints return 429 after rate limit
- [ ] Large requests are rejected (>10MB)
- [ ] Security scanner runs successfully
- [ ] Admin email variations are normalized
- [ ] Audit logs are written correctly

---

## Notes

- Most recommendations are **optional enhancements**
- Your current security posture is **already strong**
- Prioritize based on your threat model
- Consider implementing before production launch

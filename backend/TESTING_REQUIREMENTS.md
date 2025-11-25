# ⚠️ MANDATORY TESTING REQUIREMENTS

## Critical Policy for All Backend Development

**🚨 ALL NEW BACKEND FEATURES MUST INCLUDE COMPREHENSIVE UNIT TESTS 🚨**

This is **NOT optional**. Tests must be written and passing before any backend feature can be considered complete.

## Requirements

### For Every New Backend Feature

When you add **ANY** of the following to the backend:

- ✅ New API endpoint
- ✅ New database model
- ✅ New CRUD operation
- ✅ New business logic function
- ✅ New validation rule
- ✅ New utility function

You **MUST**:

1. **Write comprehensive unit tests** covering:

   - ✅ Happy path (success cases)
   - ✅ Error cases (400, 404, 422, 500 errors)
   - ✅ Authentication requirements (401, 403 errors)
   - ✅ Authorization (admin vs user permissions)
   - ✅ Input validation (valid and invalid data)
   - ✅ Edge cases (empty lists, null values, boundaries)

2. **Ensure tests pass** against the PostgreSQL database:

   ```bash
   cd backend
   python -m pytest tests/test_<your_feature>.py -v
   ```

3. **Verify code coverage** is at least 80% for new code:

   ```bash
   python -m pytest --cov=app --cov-report=term-missing
   ```

4. **Follow testing patterns** documented in `backend/docs/TESTING.md`

## Quick Start

### Setting Up Tests

1. **Ensure Docker containers are running:**

   ```bash
   docker-compose up -d
   ```

2. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

3. **Create your test file** following the naming convention:

   ```bash
   # For API endpoints
   touch tests/test_api_<feature_name>.py

   # For CRUD operations
   touch tests/test_crud_<feature_name>.py

   # For models
   # Add to tests/test_models.py
   ```

4. **Use this template** for new test files:

```python
"""Tests for <feature description>"""
import pytest
from httpx import AsyncClient
from app.api import deps


@pytest.mark.asyncio
class TestYourFeature:
    """Test <specific functionality>"""

    async def test_feature_success(self, client: AsyncClient, test_user):
        """Test successful operation"""
        from app.main import app

        # Mock authentication if needed
        async def override_get_current_user():
            return test_user

        app.dependency_overrides[deps.get_current_user] = override_get_current_user

        try:
            response = await client.get(
                "/api/your-endpoint",
                headers={"Authorization": "Bearer mock_token"}
            )

            assert response.status_code == 200
            data = response.json()
            # Add your assertions here
        finally:
            app.dependency_overrides.clear()

    async def test_feature_validation_error(self, client: AsyncClient):
        """Test with invalid data"""
        response = await client.post("/api/your-endpoint", json={})
        assert response.status_code == 422

    async def test_feature_not_found(self, client: AsyncClient, test_user):
        """Test with non-existent resource"""
        from app.main import app

        async def override_get_current_user():
            return test_user

        app.dependency_overrides[deps.get_current_user] = override_get_current_user

        try:
            response = await client.get("/api/your-endpoint/nonexistent-id")
            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    async def test_feature_unauthorized(self, client: AsyncClient):
        """Test without authentication"""
        response = await client.get("/api/your-endpoint")
        assert response.status_code == 403
```

## Running Tests

```bash
# Run all tests
python -m pytest

# Run tests for specific feature
python -m pytest tests/test_api_<feature>.py -v

# Run with coverage
python -m pytest --cov=app --cov-report=html
open htmlcov/index.html

# Stop on first failure (useful during development)
python -m pytest -x

# Run last failed tests
python -m pytest --lf
```

## Before Committing

**Run this checklist:**

```bash
# 1. Run all tests
python -m pytest

# 2. Check coverage
python -m pytest --cov=app --cov-report=term-missing --cov-fail-under=80

# 3. Verify your new tests are included
python -m pytest --collect-only | grep "test_<your_feature>"

# 4. Verify tests pass against PostgreSQL
docker-compose ps  # Ensure postgres is running
python -m pytest tests/test_<your_feature>.py -v
```

## Available Test Fixtures

Common fixtures you'll use:

- `client` - Unauthenticated HTTP test client
- `test_user` - Admin user
- `test_regular_user` - Non-admin user
- `db_session` - Database session
- `test_outing` - Pre-created test outing
- `test_signup` - Pre-created test signup
- `test_place` - Pre-created test place
- `test_family_member` - Pre-created family member

See `tests/conftest.py` for full list.

## Complete Documentation

📖 **Full testing guide**: `backend/docs/TESTING.md`

📋 **Test fixes summary**: `backend/TEST_FIXES_SUMMARY.md`

## Why This Matters

Tests ensure:

- ✅ Features work as expected
- ✅ Changes don't break existing functionality
- ✅ Edge cases are handled
- ✅ Security requirements are enforced
- ✅ Code is maintainable long-term
- ✅ New developers can understand the codebase

## Questions?

1. Check `backend/docs/TESTING.md` first
2. Look at existing test files for examples:
   - `tests/test_api_family.py` - Good example of API tests
   - `tests/test_api_places.py` - Another good example
   - `tests/test_api_clerk_auth.py` - Authentication mocking example
3. Ask the team if still unclear

---

**Remember: No tests = No merge. Tests are mandatory for all backend features.**

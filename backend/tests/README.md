# Backend Tests

Comprehensive unit tests for the Scouting Outing Manager backend API.

## Test Structure

```
tests/
├── conftest.py                 # Pytest fixtures and configuration
├── test_core_security.py       # Security and authentication tests
├── test_core_config.py         # Configuration tests
├── test_crud_trip.py          # Trip CRUD operations tests
├── test_crud_signup.py        # Signup CRUD operations tests
├── test_api_auth.py           # Authentication endpoint tests
├── test_api_trips.py          # Trip API endpoint tests
├── test_api_signups.py        # Signup API endpoint tests
└── test_models.py             # Database model tests
```

## Setup

### Install Test Dependencies

```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt
```

### Test Dependencies

- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Code coverage reporting
- `pytest-mock` - Mocking support
- `httpx` - HTTP client for API testing
- `faker` - Test data generation

## Running Tests

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_api_auth.py
```

### Run Specific Test Class

```bash
pytest tests/test_api_auth.py::TestLogin
```

### Run Specific Test

```bash
pytest tests/test_api_auth.py::TestLogin::test_login_success
```

### Run with Verbose Output

```bash
pytest -v
```

### Run with Coverage Report

```bash
pytest --cov=app --cov-report=html
```

This generates an HTML coverage report in `htmlcov/index.html`.

### Run Tests by Marker

```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

## Test Coverage

The test suite covers:

### Core Functionality
- ✅ Password hashing and verification
- ✅ JWT token creation and validation
- ✅ Configuration management
- ✅ CORS settings

### CRUD Operations
- ✅ Trip creation, retrieval, update, deletion
- ✅ Signup creation, retrieval, deletion
- ✅ Participant management
- ✅ Dietary restrictions and allergies

### API Endpoints
- ✅ Authentication (login, logout, current user)
- ✅ Trip management (CRUD operations)
- ✅ Signup management (create, view, cancel)
- ✅ Admin-only endpoints
- ✅ Public endpoints

### Business Logic
- ✅ Scouting America two-deep leadership requirement
- ✅ Scouting America female leader requirement
- ✅ Youth protection training validation
- ✅ Trip capacity management
- ✅ Signup validation

### Database Models
- ✅ Model creation and relationships
- ✅ Computed properties
- ✅ Cascade deletions
- ✅ Unique constraints

## Writing New Tests

### Test Structure

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestFeature:
    """Test feature description"""
    
    async def test_specific_behavior(self, client: AsyncClient, test_user):
        """Test specific behavior description"""
        response = await client.get("/api/endpoint")
        
        assert response.status_code == 200
        assert "expected_key" in response.json()
```

### Available Fixtures

- `db_session` - Database session for tests
- `client` - HTTP client for API testing
- `test_user` - Admin user for authentication
- `test_user_token` - JWT token for test user
- `auth_headers` - Authorization headers with token
- `test_trip` - Sample overnight trip
- `test_day_trip` - Sample day trip
- `test_signup` - Sample signup with participants
- `test_participant_with_restrictions` - Participant with dietary needs
- `sample_signup_data` - Sample signup request data
- `sample_trip_data` - Sample trip request data

### Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **One assertion per test** - Keep tests focused on a single behavior
3. **Use fixtures** - Leverage pytest fixtures for test data setup
4. **Test edge cases** - Include tests for error conditions and boundary cases
5. **Mock external dependencies** - Use mocks for external services
6. **Keep tests independent** - Tests should not depend on each other
7. **Use async/await** - All database and API tests should be async

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    cd backend
    pip install -r requirements.txt -r requirements-test.txt
    pytest --cov=app --cov-report=xml
```

## Troubleshooting

### Database Connection Issues

Tests use an in-memory SQLite database by default. If you encounter issues:

1. Check that `aiosqlite` is installed
2. Verify test database URL in `conftest.py`

### Async Test Failures

If async tests fail with event loop errors:

1. Ensure `pytest-asyncio` is installed
2. Check that `asyncio_mode = auto` is set in `pytest.ini`

### Import Errors

If you get import errors:

1. Ensure you're running tests from the `backend` directory
2. Check that the `app` package is in your Python path
3. Verify all dependencies are installed

## Coverage Goals

Target coverage: **>90%**

Current coverage by module:
- Core: ~95%
- CRUD: ~90%
- API Endpoints: ~90%
- Models: ~85%

## Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
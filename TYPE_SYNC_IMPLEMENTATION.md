# Type Synchronization Implementation Plan

## Overview
This document outlines the implementation of automatic type synchronization between the Python/FastAPI backend and TypeScript frontend using OpenAPI code generation and contract testing.

## Phase 1: OpenAPI Type Generation (Immediate - 1 Day)

### Step 1.1: Install OpenAPI Generator
```bash
cd frontend
npm install --save-dev @openapitools/openapi-generator-cli
npm install --save-dev openapi-typescript
```

**Alternative (Recommended):** Use `openapi-typescript` for better TypeScript integration:
```bash
npm install --save-dev openapi-typescript
```

### Step 1.2: Create Type Generation Script

Create `frontend/scripts/generate-types.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Generating TypeScript types from OpenAPI spec..."

# Ensure backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Fetch OpenAPI spec
curl -s http://localhost:8000/openapi.json -o openapi.json

# Generate TypeScript types
npx openapi-typescript openapi.json -o src/types/generated.ts

# Clean up
rm openapi.json

echo "✅ Types generated successfully at src/types/generated.ts"
```

Make it executable:
```bash
chmod +x frontend/scripts/generate-types.sh
```

### Step 1.3: Update package.json Scripts

Add to `frontend/package.json`:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "generate-types": "bash scripts/generate-types.sh",
    "prebuild": "npm run generate-types",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 1.4: Create Type Mapping Helper

Create `frontend/src/types/api-helpers.ts`:
```typescript
import { components, paths } from './generated';

// Extract types from OpenAPI spec
export type Trip = components['schemas']['TripResponse'];
export type TripCreate = components['schemas']['TripCreate'];
export type TripUpdate = components['schemas']['TripUpdate'];
export type SignupCreate = components['schemas']['SignupCreate'];
export type SignupResponse = components['schemas']['SignupResponse'];
export type ParticipantResponse = components['schemas']['ParticipantResponse'];
export type FamilyContact = components['schemas']['FamilyContact'];
export type DietaryRestriction = components['schemas']['DietaryRestriction'];
export type Allergy = components['schemas']['Allergy'];

// API response types
export type GetTripsResponse = paths['/api/trips']['get']['responses']['200']['content']['application/json'];
export type GetAvailableTripsResponse = paths['/api/trips/available']['get']['responses']['200']['content']['application/json'];
export type CreateTripResponse = paths['/api/trips']['post']['responses']['201']['content']['application/json'];

// Error types
export type APIError = components['schemas']['HTTPValidationError'];
```

### Step 1.5: Update Existing Code to Use Generated Types

**Option A: Gradual Migration (Recommended)**
1. Keep existing `frontend/src/types/index.ts` for now
2. Import generated types in new code
3. Gradually replace manual types with generated ones

**Option B: Complete Migration**
1. Backup `frontend/src/types/index.ts` to `index.ts.backup`
2. Replace imports throughout codebase
3. Update `api.ts` to use generated types

### Step 1.6: Add .gitignore Entry

Add to `frontend/.gitignore`:
```
# Generated types
src/types/generated.ts
openapi.json
```

### Step 1.7: Initial Type Generation

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, generate types
cd frontend
npm run generate-types
```

---

## Phase 2: Contract Testing & Automation (1 Week)

### Step 2.1: Add Contract Tests

Install testing dependencies:
```bash
cd backend
pip install pytest-asyncio httpx
```

Create `backend/tests/test_contracts.py`:
```python
"""Contract tests to ensure API responses match frontend expectations"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta


@pytest.mark.asyncio
class TestTripContracts:
    """Verify Trip API contracts"""
    
    async def test_trip_response_structure(self, client: AsyncClient, test_trip):
        """Verify TripResponse has all required fields"""
        response = await client.get("/api/trips/available")
        assert response.status_code == 200
        
        data = response.json()
        assert "trips" in data
        assert "total" in data
        
        if len(data["trips"]) > 0:
            trip = data["trips"][0]
            # Required fields
            assert "id" in trip
            assert "name" in trip
            assert "trip_date" in trip
            assert "location" in trip
            assert "max_participants" in trip
            assert "capacity_type" in trip
            assert "signup_count" in trip
            assert "available_spots" in trip
            assert "is_full" in trip
            assert "is_overnight" in trip
            assert "created_at" in trip
            assert "updated_at" in trip
            
            # Computed fields
            assert "total_vehicle_capacity" in trip
            assert "needs_more_drivers" in trip
            assert "adult_count" in trip
            assert "needs_two_deep_leadership" in trip
            assert "needs_female_leader" in trip
    
    async def test_create_trip_contract(self, client: AsyncClient, auth_headers):
        """Verify trip creation accepts correct fields"""
        trip_data = {
            "name": "Contract Test Trip",
            "trip_date": (date.today() + timedelta(days=30)).isoformat(),
            "end_date": (date.today() + timedelta(days=31)).isoformat(),
            "location": "Test Location",
            "description": "Test description",
            "max_participants": 20,
            "capacity_type": "fixed",
            "is_overnight": True,
            "trip_lead_name": "Test Lead",
            "trip_lead_email": "lead@test.com",
            "trip_lead_phone": "555-1234"
        }
        
        response = await client.post(
            "/api/trips",
            headers=auth_headers,
            json=trip_data
        )
        
        assert response.status_code == 201
        result = response.json()
        
        # Verify all input fields are in response
        for key in trip_data:
            assert key in result


@pytest.mark.asyncio
class TestSignupContracts:
    """Verify Signup API contracts"""
    
    async def test_signup_response_structure(self, client: AsyncClient, test_signup):
        """Verify SignupResponse has all required fields including warnings"""
        response = await client.get(f"/api/signups/{test_signup.id}")
        assert response.status_code == 200
        
        signup = response.json()
        
        # Required fields
        assert "id" in signup
        assert "trip_id" in signup
        assert "family_contact_name" in signup
        assert "family_contact_email" in signup
        assert "family_contact_phone" in signup
        assert "participants" in signup
        assert "participant_count" in signup
        assert "scout_count" in signup
        assert "adult_count" in signup
        assert "created_at" in signup
        
        # New field that caused the 422 error
        assert "warnings" in signup
        assert isinstance(signup["warnings"], list)
    
    async def test_create_signup_returns_warnings(self, client: AsyncClient, test_trip):
        """Verify signup creation returns warnings field"""
        signup_data = {
            "trip_id": str(test_trip.id),
            "family_contact": {
                "email": "test@example.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-9999"
            },
            "participants": [
                {
                    "full_name": "Test Scout",
                    "participant_type": "scout",
                    "gender": "female",
                    "age": 12,
                    "troop_number": "123",
                    "dietary_restrictions": [],
                    "allergies": []
                }
            ]
        }
        
        response = await client.post("/api/signups", json=signup_data)
        assert response.status_code == 201
        
        result = response.json()
        assert "warnings" in result
        assert isinstance(result["warnings"], list)
        
        # Should have warning about female leader
        assert any("female adult leader" in w.lower() for w in result["warnings"])


@pytest.mark.asyncio
class TestParticipantContracts:
    """Verify Participant structure in responses"""
    
    async def test_participant_response_structure(self, client: AsyncClient, test_signup):
        """Verify ParticipantResponse has all required fields"""
        response = await client.get(f"/api/signups/{test_signup.id}")
        assert response.status_code == 200
        
        signup = response.json()
        assert len(signup["participants"]) > 0
        
        participant = signup["participants"][0]
        
        # Required fields
        assert "id" in participant
        assert "name" in participant
        assert "age" in participant
        assert "participant_type" in participant
        assert "is_adult" in participant
        assert "gender" in participant
        assert "has_youth_protection" in participant
        assert "vehicle_capacity" in participant
        assert "dietary_restrictions" in participant
        assert "allergies" in participant
        assert "created_at" in participant
        
        # Optional fields
        assert "troop_number" in participant or participant["troop_number"] is None
        assert "patrol_name" in participant or participant["patrol_name"] is None
        assert "medical_notes" in participant or participant["medical_notes"] is None
```

### Step 2.2: Create Pre-commit Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Check if backend files changed
if git diff --cached --name-only | grep -q "^backend/app/schemas/"; then
    echo "📝 Backend schema files changed, regenerating types..."
    
    # Check if backend is running
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        cd frontend
        npm run generate-types
        
        # Add generated types to commit if they changed
        if git diff --name-only | grep -q "src/types/generated.ts"; then
            git add src/types/generated.ts
            echo "✅ Updated types added to commit"
        fi
        cd ..
    else
        echo "⚠️  Backend not running. Please regenerate types manually:"
        echo "   cd frontend && npm run generate-types"
        echo ""
        echo "Continue with commit? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo "✅ Pre-commit checks passed"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Step 2.3: Add CI/CD Type Validation

Create `.github/workflows/type-check.yml`:
```yaml
name: Type Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  type-check:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: scout_trips_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Start backend
        run: |
          cd backend
          uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 10
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/scout_trips_test
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Generate types
        run: |
          cd frontend
          npm run generate-types
      
      - name: Type check
        run: |
          cd frontend
          npm run type-check
      
      - name: Run contract tests
        run: |
          cd backend
          pytest tests/test_contracts.py -v
```

### Step 2.4: Create Documentation

Create `docs/TYPE_SYNCHRONIZATION.md`:
```markdown
# Type Synchronization Guide

## Overview
This project uses OpenAPI code generation to automatically synchronize TypeScript types with the Python/FastAPI backend schemas.

## How It Works

1. **Backend defines schemas** using Pydantic models in `backend/app/schemas/`
2. **FastAPI generates OpenAPI spec** automatically at `/openapi.json`
3. **openapi-typescript generates TypeScript types** from the spec
4. **Frontend uses generated types** for type-safe API calls

## Workflow

### When Backend Schemas Change

1. Update Pydantic schema in `backend/app/schemas/`
2. Run backend: `cd backend && uvicorn app.main:app --reload`
3. Generate types: `cd frontend && npm run generate-types`
4. Update frontend code to use new types
5. Commit both backend and generated types

### Pre-commit Hook

The pre-commit hook automatically:
- Detects changes to backend schemas
- Regenerates TypeScript types
- Adds updated types to the commit

### CI/CD Pipeline

GitHub Actions automatically:
- Generates types from backend
- Runs TypeScript type checking
- Runs contract tests
- Fails if types don't match

## Manual Type Generation

```bash
# Ensure backend is running
cd backend
uvicorn app.main:app --reload

# In another terminal
cd frontend
npm run generate-types
```

## Using Generated Types

```typescript
// Import from generated types
import { Trip, SignupCreate, SignupResponse } from './types/generated';

// Use in API calls
async function createSignup(data: SignupCreate): Promise<SignupResponse> {
  const response = await fetch('/api/signups', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## Contract Tests

Contract tests in `backend/tests/test_contracts.py` verify:
- Response structures match frontend expectations
- All required fields are present
- New fields are properly added

Run contract tests:
```bash
cd backend
pytest tests/test_contracts.py -v
```

## Troubleshooting

### Types not generating
- Ensure backend is running on port 8000
- Check backend health: `curl http://localhost:8000/health`
- Manually fetch spec: `curl http://localhost:8000/openapi.json`

### Type mismatches
- Regenerate types: `npm run generate-types`
- Check for manual type overrides in `types/index.ts`
- Run contract tests to identify issues

### Pre-commit hook not working
- Ensure hook is executable: `chmod +x .git/hooks/pre-commit`
- Check backend is running before committing
- Manually run: `.git/hooks/pre-commit`
```

### Step 2.5: Update README

Add to main `README.md`:
```markdown
## Type Synchronization

This project uses automatic type synchronization between backend and frontend. See [docs/TYPE_SYNCHRONIZATION.md](docs/TYPE_SYNCHRONIZATION.md) for details.

### Quick Start

```bash
# Generate types from backend
cd frontend
npm run generate-types

# Type check frontend
npm run type-check
```
```

---

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Install `openapi-typescript` in frontend
- [ ] Create `scripts/generate-types.sh`
- [ ] Update `package.json` scripts
- [ ] Create `types/api-helpers.ts`
- [ ] Add `.gitignore` entries
- [ ] Run initial type generation
- [ ] Verify generated types work

### Phase 2: Testing & Automation (Week 1)
- [ ] Create `test_contracts.py` with contract tests
- [ ] Run contract tests and verify they pass
- [ ] Create pre-commit hook
- [ ] Test pre-commit hook
- [ ] Create GitHub Actions workflow
- [ ] Create `TYPE_SYNCHRONIZATION.md` documentation
- [ ] Update main README
- [ ] Train team on new workflow

---

## Benefits

1. **Automatic Synchronization**: Types update automatically when backend changes
2. **Compile-Time Safety**: TypeScript catches mismatches before runtime
3. **Single Source of Truth**: Backend Pydantic schemas are the authority
4. **Contract Testing**: Automated tests verify API contracts
5. **CI/CD Integration**: Prevents merging incompatible changes
6. **Developer Experience**: Clear errors when types don't match

---

## Migration Strategy

### Gradual Migration (Recommended)
1. Generate types alongside existing manual types
2. Use generated types for new code
3. Gradually replace manual types in existing code
4. Remove manual types once migration complete

### Timeline
- **Week 1**: Setup and initial generation
- **Week 2**: Contract tests and automation
- **Week 3-4**: Gradual migration of existing code
- **Week 5**: Remove manual types, full cutover

---

## Maintenance

### Regular Tasks
- Regenerate types after backend schema changes
- Run contract tests before releases
- Update documentation when workflow changes

### Monitoring
- CI/CD pipeline shows type check status
- Contract tests catch breaking changes
- Pre-commit hook prevents accidental mismatches
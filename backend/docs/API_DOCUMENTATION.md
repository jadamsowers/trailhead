# API Documentation Guide

The Scouting Outing Manager API provides **two interactive documentation interfaces** that are automatically generated from your code.

## 🎯 Quick Access

Once the server is running, access the documentation at:

| Interface | URL | Best For |
|-----------|-----|----------|
| **Swagger UI** | http://localhost:8000/docs | Interactive testing and exploration |
| **ReDoc** | http://localhost:8000/redoc | Reading and reference documentation |
| **OpenAPI JSON** | http://localhost:8000/openapi.json | API specification for tools |

## 🚀 Starting the Server

```bash
cd backend

# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📖 Swagger UI (Interactive Documentation)

**URL:** http://localhost:8000/docs

### Features

✅ **Try It Out** - Execute API calls directly from the browser
✅ **Request/Response Examples** - See sample data for all endpoints
✅ **Authentication** - Test protected endpoints with JWT tokens
✅ **Schema Validation** - View all data models and validation rules
✅ **Organized by Tags** - Endpoints grouped by functionality

### How to Use Swagger UI

#### 1. Browse Endpoints

- Endpoints are organized by tags: `outings`, `signups`, `csv-import-export`
- Click any endpoint to expand and see details
- View request parameters, body schemas, and response formats

#### 2. Test Public Endpoints

```
1. Click on "GET /api/outings" to expand
2. Click "Try it out" button
3. Click "Execute" to make the request
4. View the response below
```

#### 3. Test Protected Endpoints (Admin)

```
1. First, authenticate:
   - Expand "POST /api/auth/login"
   - Click "Try it out"
   - Enter credentials:
     username: admin
     password: admin123
   - Click "Execute"
   - Copy the "access_token" from response

2. Authorize Swagger:
   - Click the "Authorize" button (🔒 icon at top)
   - Enter: Bearer <your_access_token>
   - Click "Authorize"
   - Click "Close"

3. Now you can test admin endpoints:
   - Try "POST /api/outings" to create a outing
   - Try "GET /api/outings/{outing_id}/signups" to view signups
```

#### 4. Create a Test Outing

```
1. Authorize with admin credentials (see above)
2. Expand "POST /api/outings"
3. Click "Try it out"
4. Edit the request body:
   {
     "name": "Summer Camp 2026",
     "description": "Week-long summer camp at Camp Wilderness",
     "start_date": "2026-07-15T09:00:00",
     "end_date": "2026-07-21T16:00:00",
     "location": "Camp Wilderness",
     "max_participants": 50,
     "is_overnight": true
   }
5. Click "Execute"
6. Copy the outing "id" from the response
```

#### 5. Create a Test Signup

```
1. Expand "POST /api/signups"
2. Click "Try it out"
3. Edit the request body with your outing_id:
   {
     "outing_id": "<paste-outing-id-here>",
     "contact_name": "John Smith",
     "contact_email": "john.smith@example.com",
     "contact_phone": "555-0123",
     "participants": [
       {
         "name": "Tommy Smith",
         "date_of_birth": "2010-05-15",
         "gender": "male",
         "is_adult": false,
         "troop_number": "123",
         "patrol_name": "Eagles",
         "dietary_restrictions": ["vegetarian"],
         "allergies": ["peanuts"]
       },
       {
         "name": "John Smith",
         "date_of_birth": "1980-03-20",
         "gender": "male",
         "is_adult": true,
         "has_youth_protection_training": true,
         "vehicle_capacity": 5,
         "dietary_restrictions": [],
         "allergies": []
       }
     ]
   }
4. Click "Execute"
```

## 📚 ReDoc (Reference Documentation)

**URL:** http://localhost:8000/redoc

### Features

✅ **Clean Reading Experience** - Beautiful, easy-to-read layout
✅ **Search Functionality** - Quickly find endpoints and schemas
✅ **Code Examples** - Multiple language examples for each endpoint
✅ **Downloadable** - Export as PDF or print
✅ **Three-Panel Layout** - Navigation, content, and examples

### Best Use Cases

- **Reference Documentation** - When you need to look up endpoint details
- **Sharing with Team** - Clean format for documentation sharing
- **Integration Planning** - Review all endpoints and schemas at once
- **Client Development** - See request/response formats clearly

### Navigation

- **Left Panel** - Table of contents with all endpoints
- **Center Panel** - Detailed endpoint documentation
- **Right Panel** - Request/response examples in multiple formats

## 🔧 OpenAPI Specification

**URL:** http://localhost:8000/openapi.json

### What It Is

The OpenAPI (formerly Swagger) specification is a JSON file that describes your entire API:
- All endpoints and their methods
- Request/response schemas
- Authentication requirements
- Data models and validation rules

### Use Cases

#### 1. Generate Client SDKs

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g typescript-axios \
  -o ./frontend/src/api-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g python \
  -o ./python-client
```

#### 2. Import into Postman

```
1. Open Postman
2. Click "Import"
3. Select "Link"
4. Enter: http://localhost:8000/openapi.json
5. Click "Continue"
```

#### 3. Import into Insomnia

```
1. Open Insomnia
2. Click "Create" → "Import From"
3. Select "URL"
4. Enter: http://localhost:8000/openapi.json
5. Click "Fetch and Import"
```

## 🎨 Customization

The documentation is automatically generated from your code. To enhance it:

### 1. Add Endpoint Descriptions

```python
@router.get("/outings/{outing_id}")
async def get_outing(outing_id: UUID):
    """
    Get a specific outing by ID.
    
    Returns detailed information about a single outing including:
    - Outing details (name, dates, location)
    - Capacity information
    - Current signup count
    """
    # endpoint code
```

### 2. Add Response Examples

```python
from fastapi import Response

@router.post("/outings", response_model=OutingResponse)
async def create_outing(outing: OutingCreate):
    """
    Create a new outing.
    
    Example response:
    ```json
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Summer Camp 2026",
      "start_date": "2026-07-15T09:00:00",
      "max_participants": 50
    }
    ```
    """
    # endpoint code
```

### 3. Add Tags and Metadata

```python
@router.get("/outings", tags=["outings", "public"])
async def list_outings():
    """List all available outings"""
    # endpoint code
```

## 🔐 Authentication in Documentation

### Testing Protected Endpoints

1. **Get Access Token**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=admin123"
   ```

2. **Use in Swagger UI**
   - Click "Authorize" button (🔒)
   - Enter: `Bearer <your_access_token>`
   - Click "Authorize"

3. **Use in curl**
   ```bash
   curl -X GET http://localhost:8000/api/outings \
     -H "Authorization: Bearer <your_access_token>"
   ```

## 📊 API Endpoint Overview

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and links |
| GET | `/api/health` | Health check |
| GET | `/api/outings` | List available outings |
| POST | `/api/signups` | Create signup |

### Admin Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/outings` | Create new outing |
| PUT | `/api/outings/{id}` | Update outing |
| DELETE | `/api/outings/{id}` | Delete outing |
| GET | `/api/outings/{id}/signups` | View outing signups |
| POST | `/api/csv/outings/{id}/import-roster` | Import CSV roster |
| GET | `/api/csv/outings/{id}/export-roster` | Export CSV roster |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (get tokens) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate token) |

## 🐛 Troubleshooting

### Documentation Not Loading

```bash
# Check if server is running
curl http://localhost:8000/

# Check if docs endpoint is accessible
curl http://localhost:8000/docs

# Restart server
uvicorn app.main:app --reload
```

### Authentication Not Working

```bash
# Verify admin user exists
python -m app.db.init_db

# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

### CORS Issues

If accessing from a different origin, ensure CORS is configured in `.env`:

```bash
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 📱 Mobile Access

Both Swagger UI and ReDoc are mobile-responsive. Access from your phone/tablet:

```
http://<your-server-ip>:8000/docs
http://<your-server-ip>:8000/redoc
```

## 🎓 Learning Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **ReDoc**: https://redocly.com/redoc/

## 💡 Tips

1. **Use Swagger for Testing** - Interactive and immediate feedback
2. **Use ReDoc for Reading** - Better for understanding the full API
3. **Export OpenAPI Spec** - Generate client libraries automatically
4. **Add Descriptions** - Enhance auto-generated docs with details
5. **Test Before Deploying** - Verify all endpoints work as expected

## 🚀 Next Steps

1. Start the server: `uvicorn app.main:app --reload`
2. Open Swagger UI: http://localhost:8000/docs
3. Test the health endpoint
4. Create a test outing
5. Create a test signup
6. Explore all available endpoints!
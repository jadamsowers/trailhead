# Authentication Setup Guide

This guide will help you set up and test the simple password-based authentication system for the Scouting Outing Manager.

## Overview

The authentication system includes:
- **Frontend**: Login page, protected routes, authentication context
- **Backend**: JWT-based authentication with login/logout endpoints
- **Default Admin User**: Email: `admin@scouttrips.com`, Password: `changeme123`

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies (if not already done)
```bash
cd backend
pip install -r requirements.txt
```

#### Run Database Migrations
```bash
# Make sure you're in the backend directory
alembic upgrade head
```

#### Create Admin User
```bash
# From the backend directory
python3 -m scripts.create_admin
```

This will create an admin user with:
- Email: `admin@scouttrips.com`
- Password: `changeme123`
- Role: `admin`

#### Start the Backend Server
```bash
# From the backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup

#### Install Dependencies (if not already done)
```bash
# From the project root
npm install
```

#### Start the Frontend Development Server
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Testing Authentication

### 1. Test Login via UI

1. Navigate to `http://localhost:3000`
2. Click on "Login" in the navigation bar or go to `http://localhost:3000/login`
3. Enter credentials:
   - Email: `admin@scouttrips.com`
   - Password: `changeme123`
4. Click "Login"
5. You should be redirected to the Admin page

### 2. Test Protected Routes

1. Try accessing `http://localhost:3000/admin` without logging in
   - You should be redirected to the login page
2. After logging in, you should be able to access the admin page
3. The navigation bar should show:
   - Your email address
   - A "Logout" button

### 3. Test Logout

1. Click the "Logout" button in the navigation bar
2. You should be logged out
3. Trying to access `/admin` should redirect you to login again

### 4. Test API Endpoints Directly

#### Login Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@scouttrips.com",
    "password": "changeme123"
  }'
```

Expected response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "admin@scouttrips.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

#### Get Current User
```bash
# Replace YOUR_TOKEN with the access_token from login response
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

### Frontend Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages authentication state
   - Provides login/logout functions
   - Stores JWT token in localStorage

2. **LoginPage** (`src/pages/LoginPage.tsx`)
   - Simple login form
   - Shows default credentials for testing
   - Handles login errors

3. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Wraps protected pages
   - Redirects to login if not authenticated
   - Can require admin role

4. **Updated App.tsx**
   - Wraps app in AuthProvider
   - Shows login/logout in navigation
   - Protects admin routes

### Backend Endpoints

1. **POST /api/auth/login**
   - Accepts email and password
   - Returns JWT access token and user info
   - Token expires in 15 minutes (configurable)

2. **GET /api/auth/me**
   - Returns current user information
   - Requires valid JWT token

3. **POST /api/auth/logout**
   - Logs out current user
   - Client should remove token from storage

### Security Features

- **JWT Tokens**: Stateless authentication
- **Password Hashing**: Using bcrypt via passlib
- **Protected Routes**: Admin endpoints require authentication
- **Role-Based Access**: Admin role required for admin pages
- **Token Expiration**: Configurable token lifetime

## Configuration

### Backend Configuration

Edit `backend/app/core/config.py`:

```python
SECRET_KEY = "your-secret-key-here"  # Change in production!
ACCESS_TOKEN_EXPIRE_MINUTES = 15
ALGORITHM = "HS256"
```

### Environment Variables

Create `backend/.env`:

```env
SECRET_KEY=your-super-secret-key-change-in-production
DATABASE_URL=postgresql+asyncpg://user:password@localhost/scouttrips
```

## Troubleshooting

### "Module not found" errors
- Make sure you've installed backend dependencies: `pip install -r requirements.txt`
- Make sure you've installed frontend dependencies: `npm install`

### "Admin user already exists"
- The admin user has already been created
- Use the existing credentials or modify the script to create a different user

### "Could not validate credentials"
- Check that the token is being sent correctly
- Verify the token hasn't expired
- Check that the SECRET_KEY matches between token creation and validation

### CORS errors
- Make sure the backend CORS settings allow your frontend origin
- Check `backend/app/core/config.py` for BACKEND_CORS_ORIGINS

## Next Steps

1. **Change Default Password**: After first login, implement password change functionality
2. **Add User Management**: Create endpoints to manage users
3. **Implement Refresh Tokens**: Add long-lived refresh tokens for better UX
4. **Add Password Reset**: Implement forgot password functionality
5. **Enhanced Security**: Add rate limiting, account lockout, etc.

## API Documentation

Full API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
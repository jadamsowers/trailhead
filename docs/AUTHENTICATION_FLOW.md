# Authentication Flow

## Overview

The authentication system uses Authentik for modern OAuth/OIDC authentication, with a separate one-time admin setup process for initial configuration.

## User Flows

### 1. Regular Users (Parents/Participants)
- **Login Method**: OAuth via Authentik
- **Flow**:
  1. Navigate to [`/login`](../frontend/src/pages/LoginPage.tsx)
  2. Click "Sign in with Authentik"
  3. Complete Authentik authentication
  4. After successful authentication, redirected back to the application

### 2. Initial Admin Setup (One-Time)
- **Purpose**: Create the first administrator account
- **Availability**: Only accessible when no admin users exist
- **Flow**:
  1. Navigate to [`/admin-setup`](../frontend/src/pages/AdminSetupPage.tsx)
  2. Fill in admin details (email, password, full name)
  3. Submit to create admin account
  4. Redirected to login page
  5. Admin can now log in using the legacy password-based authentication

### 3. Admin Login (Legacy)
- **Method**: Password-based authentication (kept for backward compatibility)
- **Usage**: For admin accounts created through the setup process
- **Note**: This is maintained for administrative access but not exposed on the main login page

## Pages

### Login Page ([`/login`](../frontend/src/pages/LoginPage.tsx))
- **Primary Action**: Authentik OAuth login
- **Secondary Action**: Link to admin setup (for first-time setup)
- **Features**:
  - Clean, OAuth-focused interface
  - Success message display (after admin setup)
  - Information about OAuth security

### Admin Setup Page ([`/admin-setup`](../frontend/src/pages/AdminSetupPage.tsx))
- **Access Control**: Automatically checks if admin already exists
- **Features**:
  - Form validation (password length, confirmation match)
  - One-time use (disabled after first admin is created)
  - Clear warning about one-time nature
  - Redirects to login after successful setup

## API Endpoints

### Backend Endpoints ([`backend/app/api/endpoints/auth.py`](../backend/app/api/endpoints/auth.py))

#### `GET /api/auth/setup-status`
- **Purpose**: Check if initial admin setup is complete
- **Returns**: `{ setup_complete: boolean }`
- **Logic**: Returns true if any admin user exists

#### `POST /api/auth/setup-admin`
- **Purpose**: Create the initial admin user
- **Access**: Only works when no admin exists
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "securepassword",
    "full_name": "Admin Name"
  }
  ```
- **Validation**:
  - Checks no admin exists
  - Password minimum 8 characters
  - Email uniqueness
- **Returns**: Success message and user ID

#### `POST /api/auth/login` (Legacy)
- **Purpose**: Password-based login for admin accounts
- **Usage**: Maintained for admin access
- **Note**: Not exposed on main login page

## Frontend API Integration ([`frontend/src/services/api.ts`](../frontend/src/services/api.ts))

### Methods in `authAPI`
```typescript
// Check if admin setup is complete
async checkSetupStatus(): Promise<{ setup_complete: boolean }>

// Create initial admin account
async setupAdmin(data: {
  email: string;
  password: string;
  full_name: string;
}): Promise<{ message: string; user_id: string }>
```

## Security Considerations

1. **OAuth First**: Regular users must use OAuth via Authentik, providing better security
2. **One-Time Setup**: Admin setup endpoint is self-disabling after first use
3. **Password Requirements**: Minimum 8 characters for admin passwords
4. **No Exposed Credentials**: OAuth users never have passwords stored in the app
5. **Legacy Support**: Admin password login maintained but not prominently displayed

## Migration Path

### For Existing Deployments
1. Existing admin accounts continue to work with password login
2. New users should be directed to Authentik OAuth registration
3. Admin setup page only accessible if no admins exist

### For New Deployments
1. First visit [`/admin-setup`](../frontend/src/pages/AdminSetupPage.tsx) to create initial admin
2. Admin logs in via Authentik OAuth or legacy password method
3. All other users use Authentik OAuth exclusively

## Benefits

1. **Simplified UX**: Single OAuth button for most users
2. **Better Security**: Authentik OAuth provides industry-standard authentication
3. **Clear Setup Process**: Dedicated page for initial configuration
4. **Reduced Attack Surface**: Password login not exposed on main page
5. **Flexible**: Maintains backward compatibility with existing admin accounts

## Testing the Flow

### Test Initial Setup
1. Ensure no admin users exist in database
2. Navigate to `/admin-setup`
3. Create admin account
4. Verify redirect to login page with success message
5. Attempt to access `/admin-setup` again - should show "already complete"

### Test OAuth Login
1. Navigate to `/login`
2. Click "Sign in with Authentik"
3. Complete Authentik authentication
4. Verify successful login and redirect

### Test Admin Access
1. Admin can access `/admin` routes
2. Regular OAuth users cannot access admin routes (unless granted admin role)
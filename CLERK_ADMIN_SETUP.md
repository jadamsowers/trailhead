# Clerk-Based Admin Setup Guide

This guide explains how the admin system works with Clerk authentication in the Scouting Outing Manager application.

## Overview

With Clerk authentication, there are **no passwords stored in the database**. Instead, admin privileges are automatically granted to users who sign in with a pre-configured admin email address.

## How It Works

1. **Configuration**: An initial admin email is configured in the environment variables
2. **First Sign-In**: When a user signs in via Clerk with that email address, they are automatically granted admin role
3. **Automatic Role Assignment**: The system checks the email on every authentication and ensures admin users maintain their role

## Configuration Methods

### Method 1: Using admin-email.txt (Recommended)

Create a file named `admin-email.txt` in the project root:

```
# Initial Admin Email Configuration
# The user who signs up with this email in Clerk will automatically get admin role

your-admin@example.com
```

This file is automatically:
- Read by the bootstrap script
- Added to `.gitignore` to prevent accidental commits
- Used to set the `INITIAL_ADMIN_EMAIL` environment variable

**Example file**: See `admin-email.txt.example`

### Method 2: Environment Variables

Set the `INITIAL_ADMIN_EMAIL` environment variable directly:

```bash
# In .env or backend/.env
INITIAL_ADMIN_EMAIL=your-admin@example.com
```

### Method 3: Bootstrap Script

When running `./bootstrap.sh`, you'll be prompted to enter the admin email. The script can optionally save it to `admin-email.txt` for future use.

## Setup Steps

### 1. Configure Admin Email

Choose one of the configuration methods above to set your admin email.

### 2. Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use an existing one
3. Get your API keys:
   - Secret Key (starts with `sk_`)
   - Publishable Key (starts with `pk_`)
4. Configure these in your environment (see `clerk-keys.txt.example`)

### 3. Run Bootstrap

```bash
./bootstrap.sh
```

The script will:
- Prompt for or read the admin email
- Configure Clerk keys
- Set up the database
- Display setup instructions

### 4. Create Admin Account in Clerk

1. Go to your application's sign-up page
2. Sign up using the configured admin email
3. Complete the Clerk sign-up process
4. On first sign-in, you'll automatically receive admin privileges

## How Admin Role Assignment Works

The admin role is assigned in [`backend/app/api/deps.py`](backend/app/api/deps.py:44-68) during authentication:

```python
# When a user signs in via Clerk
if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower():
    role = "admin"
else:
    # Get role from Clerk metadata or default to "user"
    role = metadata.get("public_metadata", {}).get("role", "user")
```

### Key Features:

- **Case-insensitive matching**: `admin@example.com` matches `Admin@Example.com`
- **Automatic on first sign-in**: No manual database setup needed
- **Persistent**: Once granted, the role is stored in the database
- **Auto-correction**: If an existing user's email matches the admin email, they're automatically upgraded to admin

## Security Considerations

### Best Practices

1. **Use a dedicated admin email**: Don't use a personal email that might be compromised
2. **Enable 2FA in Clerk**: Add an extra layer of security to the admin account
3. **Keep admin-email.txt secure**: This file is in `.gitignore` - never commit it
4. **Use strong Clerk security settings**: Configure session timeouts and security policies in Clerk dashboard
5. **Monitor admin access**: Review Clerk logs for admin sign-ins

### Changing the Admin Email

To change the admin email:

1. Update `admin-email.txt` or the `INITIAL_ADMIN_EMAIL` environment variable
2. Restart the backend service
3. The new email will automatically get admin privileges on next sign-in
4. The old admin user will retain their admin role unless manually changed

### Revoking Admin Access

To revoke admin access from a user:

1. Update their role in the database directly, or
2. Use the admin panel to change their role, or
3. Remove them from Clerk entirely

## Troubleshooting

### Admin user not getting admin role

**Check:**
1. Email matches exactly (case-insensitive)
2. `INITIAL_ADMIN_EMAIL` is set correctly in environment
3. Backend service has been restarted after configuration changes
4. Check backend logs for authentication errors

### Multiple admins needed

**Options:**
1. Set additional admin roles via Clerk metadata:
   - Go to Clerk Dashboard → Users
   - Select user → Metadata
   - Add `{"role": "admin"}` to public_metadata
2. Update roles directly in the database
3. Create an admin management interface (future feature)

### Lost access to admin account

**Recovery:**
1. Update `INITIAL_ADMIN_EMAIL` to a new email you control
2. Restart backend
3. Sign in with the new email
4. You'll automatically get admin privileges

## Files Modified for Clerk Admin Support

- [`backend/app/core/config.py`](backend/app/core/config.py:29-31) - Admin email configuration
- [`backend/app/api/deps.py`](backend/app/api/deps.py:44-68) - Auto-admin role assignment
- [`backend/app/db/init_db.py`](backend/app/db/init_db.py) - Database initialization (no password creation)
- [`bootstrap.sh`](bootstrap.sh:196-253) - Bootstrap script updates
- [`.gitignore`](.gitignore:229-231) - Added admin-email.txt
- [`admin-email.txt.example`](admin-email.txt.example) - Example configuration file

## Related Documentation

- [Clerk Migration Guide](CLERK_MIGRATION_GUIDE.md)
- [Authentication Setup](AUTHENTICATION_SETUP.md)
- [Quick Start Guide](QUICK_START.md)

## Support

For issues or questions:
1. Check the [Clerk Documentation](https://clerk.com/docs)
2. Review backend logs: `docker-compose logs backend`
3. Verify environment variables are set correctly
4. Ensure Clerk keys are valid and not expired
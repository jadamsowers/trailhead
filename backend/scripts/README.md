# Development Scripts

This directory contains utility scripts for development and testing.

## seed_dev_data.py

A script that generates fake family members and outings for development purposes by calling the backend API using Clerk authentication.

### Prerequisites

1. **Clerk Account**: You must have a Clerk account configured with the app
2. **Admin User**: You must be signed in as an admin user in Clerk
3. **Backend Running**: The backend API must be running (default: `http://localhost:8000`)
4. **Dependencies**: Install required Python packages:
   ```bash
   pip install httpx
   ```

### Getting Your Clerk Session Token

To use this script, you need a Clerk session token:

1. **Sign in to your app** in a web browser (e.g., `http://localhost:3000`)
2. **Open Browser DevTools** (Press F12 or right-click → Inspect)
3. **Go to Application/Storage tab** → Cookies
4. **Find the `__session` cookie** for your domain
5. **Copy the cookie value** - this is your Clerk session token
6. **Use it with the script** as shown below

### Usage

**Basic usage** with Clerk token:
```bash
python backend/scripts/seed_dev_data.py --clerk-token "sess_2a..."
```

**With custom API URL**:
```bash
python backend/scripts/seed_dev_data.py --clerk-token "sess_2a..." --base-url http://localhost:8080
```

**Get help**:
```bash
python backend/scripts/seed_dev_data.py --help
```

### What it creates

The script will create:

- **10 outings** with various configurations:
  - Mix of day outings and overnight outings
  - Different capacity types (fixed and vehicle-based)
  - Outings scheduled from 1 week to 3+ months in the future
  - Realistic outing names, locations, and descriptions

- **15 families** with:
  - 1-3 scouts per family (weighted toward 1-2 scouts)
  - Parent members with various properties:
    - 80% have Youth Protection Training
    - 70% have vehicles with 4-7 passenger capacity
    - Random dietary preferences (30% chance)
    - Random allergies (20% chance)
  - Scout members with:
    - Ages 11-17
    - Assigned to troops (123, 456, 789, etc.)
    - Assigned to patrols (Eagle, Wolf, Bear, etc.)
    - Random dietary preferences (25% chance)
    - Random allergies (15% chance)

### Admin Requirements

The script requires an **admin user** to create outings. The authenticated Clerk user must:

1. Have the `admin` role set in Clerk's public metadata
2. Be properly configured in the Clerk dashboard

**Setting Admin Role in Clerk**:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to Users → Select your user
3. Click on "Metadata" tab
4. Add to **Public Metadata**:
   ```json
   {
     "role": "admin"
   }
   ```
5. Save changes

Alternatively, if your email matches the `INITIAL_ADMIN_EMAIL` in the backend `.env` file, you'll automatically get admin role on first sign-in.

### Notes

- All family members are created under the authenticated Clerk user for simplicity
- In production, each family would have their own Clerk account
- All generated data uses fake names and information
- The script uses the API endpoints, so it tests the API functionality
- Session tokens expire - if you get authentication errors, get a fresh token

### Example Output

```
======================================================================
Development Data Seeding Script (Clerk Authentication)
======================================================================
🌱 Starting database seeding via API...
📡 Using API at: http://localhost:8000

🔐 Verifying Clerk authentication...
  ✓ Authenticated as: John Doe (john@example.com)
  ✓ Role: admin

🏕️  Creating outings...
  ✓ Created overnight outing: Weekend Camping at Pine Lake (fixed capacity)
  ✓ Created day outing: Day Hike - Eagle Peak Trail (fixed capacity)
  ✓ Created day outing: Kayaking Adventure (vehicle capacity)
  ...

✅ Created 10 outings

👨‍👩‍👧‍👦 Creating families...
  ℹ️  Note: Family members will be created under the admin user
  ℹ️  In a real scenario, each family would have their own user account
  ✓ Created Smith family with 2 members (1 scout(s))
  ✓ Created Johnson family with 3 members (2 scout(s))
  ...

✅ Created 15 families with 28 total members

🎉 Database seeding completed successfully!

📊 Summary:
  - Outings: 10
  - Families: 15
  - Family Members: 28

💡 Note: All family members were created under the authenticated Clerk user.
   In production, each family would have their own Clerk account.
```

### Troubleshooting

**Error: "You must be authenticated as an admin user"**
- Verify you have admin role in Clerk's public metadata
- Check that your email matches `INITIAL_ADMIN_EMAIL` in backend `.env`
- Ensure you're using a fresh session token (they expire)

**Error: "Token verification failed"**
- Get a fresh session token from the browser
- Make sure you're signed in to the app
- Verify the backend is running and Clerk is configured

**Error: "httpx is required"**
- Install httpx: `pip install httpx`

**Error: "Could not create outing"**
- Verify you have admin permissions
- Check the API logs for detailed error messages
- Ensure the database is properly initialized

**Session token expired**
- Clerk session tokens expire after a period of time
- Simply get a fresh token from the browser and try again

### Related Scripts

- `create_admin.py` - Creates an initial admin user directly in the database
# Development Scripts

This directory contains utility scripts for development and testing.

## seed_dev_data.py

A script that generates fake family members and trips for development purposes by calling the backend API.

### Prerequisites

1. The backend API must be running (default: `http://localhost:8000`)
2. Install the required dependency:
   ```bash
   pip install httpx
   ```

### Usage

**Basic usage** (assumes API is running on `http://localhost:8000`):
```bash
python backend/scripts/seed_dev_data.py
```

**Custom API URL**:
```bash
python backend/scripts/seed_dev_data.py --base-url http://localhost:8080
```

### What it creates

The script will create:

- **10 trips** with various configurations:
  - Mix of day trips and overnight trips
  - Different capacity types (fixed and vehicle-based)
  - Trips scheduled from 1 week to 3+ months in the future
  - Realistic trip names, locations, and descriptions

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

### Admin Account

The script requires an admin account to create trips. It will:

1. Try to create an admin user with:
   - Email: `admin@example.com`
   - Password: `password123`
   - Name: `Admin User`

2. If an admin already exists, it will try to login with the above credentials

**Important**: If you already have an admin account with different credentials, the script will fail. You can either:
- Use the default admin credentials above
- Modify the script to use your admin credentials
- Manually create trips using the admin interface

### Notes

- All family members are created under the admin account for simplicity
- In production, each family would have their own user account
- All generated data uses fake names and information
- The script uses the API endpoints, so it tests the API functionality
- Default password for all users: `password123`

### Example Output

```
============================================================
Development Data Seeding Script (API-based)
============================================================
🌱 Starting database seeding via API...
📡 Using API at: http://localhost:8000

🔐 Setting up admin user...
  ✓ Created admin user: admin@example.com
  ✓ Logged in as admin

🏕️  Creating trips...
  ✓ Created overnight trip: Weekend Camping at Pine Lake (fixed capacity)
  ✓ Created day trip: Day Hike - Eagle Peak Trail (fixed capacity)
  ✓ Created day trip: Kayaking Adventure (vehicle capacity)
  ...

✅ Created 10 trips

👨‍👩‍👧‍👦 Creating families...
  ℹ️  Note: Family members will be created under the admin user
  ℹ️  In a real scenario, each family would have their own user account
  ✓ Created Smith family with 2 members (1 scout(s))
  ✓ Created Johnson family with 3 members (2 scout(s))
  ...

✅ Created 15 families with 28 total members

🎉 Database seeding completed successfully!

📊 Summary:
  - Trips: 10
  - Families: 15
  - Family Members: 28

🔐 Admin credentials:
  Email: admin@example.com
  Password: password123
```

### Troubleshooting

**Error: "Could not login as admin"**
- Make sure the backend is running
- Verify the admin credentials match what's in the database
- Check the API URL is correct

**Error: "httpx is required"**
- Install httpx: `pip install httpx`

**Error: "Could not create trip"**
- Make sure you're logged in as an admin
- Check the API logs for detailed error messages
- Verify the database is properly initialized

### Related Scripts

- `create_admin.py` - Creates an initial admin user directly in the database
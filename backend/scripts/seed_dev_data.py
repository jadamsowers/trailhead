"""
Development Data Seeding Script

This script creates fake users, family members, and trips for development and testing purposes.
It uses the backend API endpoints to create realistic test data.

Usage:
    python backend/scripts/seed_dev_data.py [--base-url http://localhost:8000]
"""

import asyncio
import argparse
import sys
from datetime import date, timedelta
from typing import List, Dict, Optional
import random

try:
    import httpx
except ImportError:
    print("❌ Error: httpx is required. Install it with: pip install httpx")
    sys.exit(1)


# Fake data pools
FIRST_NAMES_MALE = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher"]
FIRST_NAMES_FEMALE = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"]
SCOUT_NAMES_MALE = ["Ethan", "Noah", "Liam", "Mason", "Jacob", "Lucas", "Logan", "Oliver", "Aiden", "Elijah"]
SCOUT_NAMES_FEMALE = ["Emma", "Olivia", "Ava", "Sophia", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", 
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

TROOP_NUMBERS = ["123", "456", "789", "234", "567", "890"]
PATROL_NAMES = ["Eagle Patrol", "Wolf Patrol", "Bear Patrol", "Fox Patrol", "Hawk Patrol", "Lion Patrol", 
                "Tiger Patrol", "Panther Patrol", "Cobra Patrol", "Dragon Patrol"]

DIETARY_PREFERENCES = ["vegetarian", "vegan", "gluten-free", "dairy-free", "kosher", "halal", "pescatarian"]
ALLERGIES = [
    {"allergy": "peanuts", "severity": "severe"},
    {"allergy": "tree nuts", "severity": "severe"},
    {"allergy": "shellfish", "severity": "moderate"},
    {"allergy": "dairy", "severity": "mild"},
    {"allergy": "eggs", "severity": "mild"},
    {"allergy": "soy", "severity": "moderate"},
    {"allergy": "wheat", "severity": "moderate"},
    {"allergy": "fish", "severity": "severe"},
]

MEDICAL_NOTES = [
    "Asthma - carries inhaler",
    "Type 1 Diabetes - requires insulin",
    "ADHD - takes medication daily",
    "Seasonal allergies",
    "Motion sickness - needs medication for long drives",
    "Bee sting allergy - carries EpiPen",
    None,
    None,
    None,
]

TRIP_NAMES = [
    "Weekend Camping at Pine Lake",
    "Day Hike - Eagle Peak Trail",
    "Kayaking Adventure",
    "Rock Climbing Workshop",
    "Backpacking Trip - Mountain Ridge",
    "Service Project - Trail Maintenance",
    "Fishing Derby",
    "Winter Camping Experience",
    "Canoeing on River Rapids",
    "Orienteering Competition",
    "Survival Skills Weekend",
    "Mountain Biking Excursion",
]

LOCATIONS = [
    "Pine Lake Campground",
    "Eagle Peak Trailhead",
    "Blue River Recreation Area",
    "Summit Rock Climbing Center",
    "Mountain Ridge Wilderness",
    "Forest Trail System",
    "Lake Vista",
    "Snow Peak Campground",
    "Rapids River Park",
    "Compass Point Park",
    "Wilderness Training Center",
    "Mountain Bike Park",
]

TRIP_DESCRIPTIONS = [
    "Join us for an exciting outdoor adventure! This is a great opportunity for scouts to develop outdoor skills and build teamwork.",
    "Come experience the great outdoors! All skill levels welcome. Bring your enthusiasm and sense of adventure.",
    "A fantastic adventure awaits! Don't miss this opportunity to explore nature and make lasting memories.",
    "This trip will challenge and inspire our scouts. Sign up today and be part of something special!",
    "Experience the thrill of outdoor adventure while learning valuable scouting skills in a safe, supervised environment.",
]


def generate_email(first_name: str, last_name: str) -> str:
    """Generate a fake email address"""
    return f"{first_name.lower()}.{last_name.lower()}@example.com"


def random_date_of_birth(min_age: int, max_age: int) -> str:
    """Generate a random date of birth for given age range"""
    today = date.today()
    age = random.randint(min_age, max_age)
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Safe day for all months
    return date(birth_year, birth_month, birth_day).isoformat()


async def create_user_and_login(client: httpx.AsyncClient, email: str, full_name: str, password: str = "password123") -> Optional[str]:
    """Create a user via setup-admin endpoint and login to get token"""
    try:
        # Try to login first (user might already exist)
        response = await client.post(
            "/api/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["access_token"]
        
        # If login fails, try to create user (only works if no admin exists yet)
        # For subsequent users, we'll need to use a different approach
        # Since the API doesn't have a public registration endpoint, we'll skip user creation
        # and just note that the first user needs to be created manually
        return None
        
    except Exception as e:
        print(f"  ⚠️  Could not create/login user {email}: {e}")
        return None


async def create_parent_member(
    client: httpx.AsyncClient,
    token: str,
    name: str,
    has_youth_protection: bool = True,
    vehicle_capacity: int = 0
) -> Optional[Dict]:
    """Create a parent family member"""
    member_data = {
        "name": name,
        "member_type": "parent",
        "date_of_birth": random_date_of_birth(30, 55),
        "has_youth_protection": has_youth_protection,
        "vehicle_capacity": vehicle_capacity,
        "medical_notes": random.choice(MEDICAL_NOTES),
        "dietary_preferences": [random.choice(DIETARY_PREFERENCES)] if random.random() < 0.3 else [],
        "allergies": [random.choice(ALLERGIES)] if random.random() < 0.2 else [],
    }
    
    try:
        response = await client.post(
            "/api/family/",
            json=member_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ⚠️  Could not create parent {name}: {e}")
        return None


async def create_scout_member(
    client: httpx.AsyncClient,
    token: str,
    name: str,
    troop_number: str,
    patrol_name: str
) -> Optional[Dict]:
    """Create a scout family member"""
    member_data = {
        "name": name,
        "member_type": "scout",
        "date_of_birth": random_date_of_birth(11, 17),
        "troop_number": troop_number,
        "patrol_name": patrol_name,
        "has_youth_protection": False,
        "vehicle_capacity": 0,
        "medical_notes": random.choice(MEDICAL_NOTES),
        "dietary_preferences": [random.choice(DIETARY_PREFERENCES)] if random.random() < 0.25 else [],
        "allergies": [random.choice(ALLERGIES)] if random.random() < 0.15 else [],
    }
    
    try:
        response = await client.post(
            "/api/family/",
            json=member_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ⚠️  Could not create scout {name}: {e}")
        return None


async def create_family(client: httpx.AsyncClient, token: str, last_name: str, num_scouts: int = 1) -> List[Dict]:
    """Create a complete family with parent(s) and scout(s)"""
    members = []
    
    # Create primary parent
    parent1_first = random.choice(FIRST_NAMES_MALE if random.random() > 0.5 else FIRST_NAMES_FEMALE)
    parent1_name = f"{parent1_first} {last_name}"
    
    # Primary parent with vehicle (70% chance)
    has_vehicle = random.random() < 0.7
    vehicle_capacity = random.choice([0, 4, 5, 6, 7]) if has_vehicle else 0
    
    parent_member = await create_parent_member(
        client, token, parent1_name,
        has_youth_protection=random.random() < 0.8,  # 80% have YPT
        vehicle_capacity=vehicle_capacity
    )
    if parent_member:
        members.append(parent_member)
    
    # Create scouts
    troop = random.choice(TROOP_NUMBERS)
    patrol = random.choice(PATROL_NAMES)
    
    for i in range(num_scouts):
        scout_first = random.choice(SCOUT_NAMES_MALE if random.random() > 0.3 else SCOUT_NAMES_FEMALE)
        scout_name = f"{scout_first} {last_name}"
        
        scout_member = await create_scout_member(client, token, scout_name, troop, patrol)
        if scout_member:
            members.append(scout_member)
    
    return members


async def create_trip(
    client: httpx.AsyncClient,
    token: str,
    name: str,
    location: str,
    days_from_now: int,
    is_overnight: bool = False,
    capacity_type: str = "fixed",
    max_participants: int = 30
) -> Optional[Dict]:
    """Create a trip"""
    trip_date = (date.today() + timedelta(days=days_from_now)).isoformat()
    end_date = (date.today() + timedelta(days=days_from_now + random.randint(1, 3))).isoformat() if is_overnight else None
    
    trip_data = {
        "name": name,
        "trip_date": trip_date,
        "end_date": end_date,
        "location": location,
        "description": random.choice(TRIP_DESCRIPTIONS),
        "max_participants": max_participants,
        "capacity_type": capacity_type,
        "is_overnight": is_overnight,
        "trip_lead_name": f"{random.choice(FIRST_NAMES_MALE)} {random.choice(LAST_NAMES)}",
        "trip_lead_email": f"leader{random.randint(1, 100)}@example.com",
        "trip_lead_phone": f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
    }
    
    try:
        response = await client.post(
            "/api/trips",
            json=trip_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ⚠️  Could not create trip {name}: {e}")
        return None


async def seed_database(base_url: str):
    """Main function to seed the database with development data"""
    print("🌱 Starting database seeding via API...")
    print(f"📡 Using API at: {base_url}")
    
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        # First, we need to create an admin user and get a token
        print("\n🔐 Setting up admin user...")
        admin_email = "admin@example.com"
        admin_password = "password123"
        admin_name = "Admin User"
        
        # Try to setup admin (only works if no admin exists)
        try:
            response = await client.post(
                "/api/setup-admin",
                json={
                    "email": admin_email,
                    "password": admin_password,
                    "full_name": admin_name
                }
            )
            if response.status_code == 201:
                print(f"  ✓ Created admin user: {admin_email}")
        except Exception:
            pass  # Admin might already exist
        
        # Login as admin
        try:
            response = await client.post(
                "/api/login",
                json={"email": admin_email, "password": admin_password}
            )
            response.raise_for_status()
            admin_token = response.json()["access_token"]
            print(f"  ✓ Logged in as admin")
        except Exception as e:
            print(f"  ❌ Could not login as admin: {e}")
            print(f"  💡 Make sure an admin user exists with email: {admin_email} and password: {admin_password}")
            return
        
        # Create trips (admin only)
        print("\n🏕️  Creating trips...")
        trips_created = 0
        
        trip_configs = [
            (TRIP_NAMES[0], LOCATIONS[0], 7, True, "fixed", 25),
            (TRIP_NAMES[1], LOCATIONS[1], 14, False, "fixed", 30),
            (TRIP_NAMES[2], LOCATIONS[2], 21, False, "vehicle", 40),
            (TRIP_NAMES[3], LOCATIONS[3], 28, False, "fixed", 20),
            (TRIP_NAMES[4], LOCATIONS[4], 35, True, "vehicle", 35),
            (TRIP_NAMES[5], LOCATIONS[5], 45, False, "fixed", 25),
            (TRIP_NAMES[6], LOCATIONS[6], 60, False, "fixed", 30),
            (TRIP_NAMES[7], LOCATIONS[7], 75, True, "vehicle", 20),
            (TRIP_NAMES[8], LOCATIONS[8], 90, False, "vehicle", 35),
            (TRIP_NAMES[9], LOCATIONS[9], 105, False, "fixed", 40),
        ]
        
        for name, location, days, overnight, cap_type, max_part in trip_configs:
            trip = await create_trip(client, admin_token, name, location, days, overnight, cap_type, max_part)
            if trip:
                trips_created += 1
                trip_type = "overnight" if overnight else "day"
                print(f"  ✓ Created {trip_type} trip: {name} ({cap_type} capacity)")
        
        print(f"\n✅ Created {trips_created} trips")
        
        # Create families
        print("\n👨‍👩‍👧‍👦 Creating families...")
        print("  ℹ️  Note: Family members will be created under the admin user")
        print("  ℹ️  In a real scenario, each family would have their own user account")
        
        families_created = 0
        total_members = 0
        
        for i, last_name in enumerate(LAST_NAMES[:15]):  # Create 15 families
            num_scouts = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
            members = await create_family(client, admin_token, last_name, num_scouts)
            if members:
                families_created += 1
                total_members += len(members)
                print(f"  ✓ Created {last_name} family with {len(members)} members ({num_scouts} scout(s))")
        
        print(f"\n✅ Created {families_created} families with {total_members} total members")
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"  - Trips: {trips_created}")
        print(f"  - Families: {families_created}")
        print(f"  - Family Members: {total_members}")
        print("\n🔐 Admin credentials:")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print("\n💡 Note: All family members were created under the admin account.")
        print("   In production, each family would register their own account.")


def main():
    parser = argparse.ArgumentParser(description="Seed development data via API")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    args = parser.parse_args()
    
    print("=" * 60)
    print("Development Data Seeding Script (API-based)")
    print("=" * 60)
    
    asyncio.run(seed_database(args.base_url))


if __name__ == "__main__":
    main()
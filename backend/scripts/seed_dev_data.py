"""
Development Data Seeding Script

This script creates fake users, family members, and outings for development and testing purposes.
It uses the backend API endpoints to create realistic test data.

Prerequisites:
    - Clerk account with API keys configured
    - Backend running with Clerk authentication enabled
    - A Clerk user account to authenticate with

Usage:
    python backend/scripts/seed_dev_data.py --clerk-token YOUR_CLERK_SESSION_TOKEN [--base-url http://localhost:8000]
    
    To get your Clerk session token:
    1. Sign in to your app in the browser
    2. Open browser DevTools (F12)
    3. Go to Application/Storage → Cookies
    4. Find the __session cookie value
    5. Use that value as your --clerk-token
"""

import asyncio
import argparse
import sys
import os
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
    "Backpacking Outing - Mountain Ridge",
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
    "This outing will challenge and inspire our scouts. Sign up today and be part of something special!",
    "Experience the thrill of outdoor adventure while learning valuable scouting skills in a safe, supervised environment.",
]


def random_date_of_birth(min_age: int, max_age: int) -> str:
    """Generate a random date of birth for given age range"""
    today = date.today()
    age = random.randint(min_age, max_age)
    birth_year = today.year - age
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Safe day for all months
    return date(birth_year, birth_month, birth_day).isoformat()


def random_youth_protection_expiration(has_training: bool) -> Optional[str]:
    """Generate a random youth protection expiration date
    
    Args:
        has_training: Whether the person has youth protection training
        
    Returns:
        ISO format date string or None if no training
    """
    if not has_training:
        return None
    
    today = date.today()
    
    # 85% have valid (future) expiration dates
    # 15% have expired certificates
    if random.random() < 0.85:
        # Valid certificate: expires 1-24 months in the future
        # Most certificates are valid for 2 years, so generate dates throughout that range
        months_until_expiry = random.randint(1, 24)
        expiry_date = today + timedelta(days=months_until_expiry * 30)
    else:
        # Expired certificate: expired 1-6 months ago
        months_since_expiry = random.randint(1, 6)
        expiry_date = today - timedelta(days=months_since_expiry * 30)
    
    return expiry_date.isoformat()


async def verify_clerk_token(client: httpx.AsyncClient, token: str) -> bool:
    """Verify the Clerk token works with the API"""
    try:
        response = await client.get(
            "/api/clerk/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            user_data = response.json()
            print(f"  ✓ Authenticated as: {user_data.get('full_name')} ({user_data.get('email')})")
            print(f"  ✓ Role: {user_data.get('role')}")
            return user_data.get('role') == 'admin'
        return False
    except Exception as e:
        print(f"  ⚠️  Token verification failed: {e}")
        return False


async def create_parent_member(
    client: httpx.AsyncClient,
    token: str,
    name: str,
    has_youth_protection: bool = True,
    vehicle_capacity: int = 0
) -> Optional[Dict]:
    """Create an adult family member"""
    youth_protection_expiration = random_youth_protection_expiration(has_youth_protection)
    
    member_data = {
        "name": name,
        "member_type": "adult",
        "date_of_birth": random_date_of_birth(30, 55),
        "has_youth_protection": has_youth_protection,
        "youth_protection_expiration": youth_protection_expiration,
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
        print(f"  ⚠️  Could not create adult {name}: {e}")
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
    """Create a complete family with adult(s) and scout(s)"""
    members = []

    # Create primary adult
    parent1_first = random.choice(FIRST_NAMES_MALE if random.random() > 0.5 else FIRST_NAMES_FEMALE)
    parent1_name = f"{parent1_first} {last_name}"
    
    # Primary adult with vehicle (70% chance)
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


async def create_outing(
    client: httpx.AsyncClient,
    token: str,
    name: str,
    location: str,
    days_from_now: int,
    is_overnight: bool = False,
    capacity_type: str = "fixed",
    max_participants: int = 30
) -> Optional[Dict]:
    """Create a outing"""
    outing_date = (date.today() + timedelta(days=days_from_now)).isoformat()
    end_date = (date.today() + timedelta(days=days_from_now + random.randint(1, 3))).isoformat() if is_overnight else None
    
    outing_data = {
        "name": name,
        "outing_date": outing_date,
        "end_date": end_date,
        "location": location,
        "description": random.choice(TRIP_DESCRIPTIONS),
        "max_participants": max_participants,
        "capacity_type": capacity_type,
        "is_overnight": is_overnight,
        "outing_lead_name": f"{random.choice(FIRST_NAMES_MALE)} {random.choice(LAST_NAMES)}",
        "outing_lead_email": f"leader{random.randint(1, 100)}@example.com",
        "outing_lead_phone": f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
    }
    
    try:
        response = await client.post(
            "/api/outings",
            json=outing_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ⚠️  Could not create outing {name}: {e}")
        return None


async def seed_database(base_url: str, clerk_token: str):
    """Main function to seed the database with development data"""
    print("🌱 Starting database seeding via API...")
    print(f"📡 Using API at: {base_url}")
    
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        # Verify Clerk token and check admin status
        print("\n🔐 Verifying Clerk authentication...")
        is_admin = await verify_clerk_token(client, clerk_token)
        
        if not is_admin:
            print("\n❌ Error: You must be authenticated as an admin user to run this script.")
            print("   Please ensure:")
            print("   1. You're signed in to the app with an admin account")
            print("   2. Your Clerk user has 'admin' role in public metadata")
            print("   3. You're using a valid session token")
            return
        
        admin_token = clerk_token
        
        # Create outings (admin only)
        print("\n🏕️  Creating outings...")
        outings_created = 0
        
        outing_configs = [
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
        
        for name, location, days, overnight, cap_type, max_part in outing_configs:
            outing = await create_outing(client, admin_token, name, location, days, overnight, cap_type, max_part)
            if outing:
                outings_created += 1
                outing_type = "overnight" if overnight else "day"
                print(f"  ✓ Created {outing_type} outing: {name} ({cap_type} capacity)")
        
        print(f"\n✅ Created {outings_created} outings")
        
        # Create families
        print("\n👨‍👩‍👧‍👦 Creating families...")
        print("  ℹ️  Note: Family members will be created under the authenticated user")
        print("  ℹ️  In production, each family would have their own Clerk account")
        
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
        print(f"  - Outings: {outings_created}")
        print(f"  - Families: {families_created}")
        print(f"  - Family Members: {total_members}")
        print("\n💡 Note: All family members were created under the authenticated Clerk user.")
        print("   In production, each family would have their own Clerk account.")


def main():
    parser = argparse.ArgumentParser(
        description="Seed development data via API using Clerk authentication",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Using session token from browser
  python backend/scripts/seed_dev_data.py --clerk-token "sess_2a..."
  
  # With custom API URL
  python backend/scripts/seed_dev_data.py --clerk-token "sess_2a..." --base-url http://localhost:8080

To get your Clerk session token:
  1. Sign in to your app in the browser
  2. Open browser DevTools (F12)
  3. Go to Application/Storage → Cookies
  4. Find the __session cookie value
  5. Use that value as your --clerk-token
        """
    )
    parser.add_argument(
        "--clerk-token",
        required=True,
        help="Clerk session token (get from browser cookies after signing in)"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    args = parser.parse_args()
    
    print("=" * 70)
    print("Development Data Seeding Script (Clerk Authentication)")
    print("=" * 70)
    
    asyncio.run(seed_database(args.base_url, args.clerk_token))


if __name__ == "__main__":
    main()
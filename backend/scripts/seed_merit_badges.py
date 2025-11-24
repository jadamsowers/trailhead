#!/usr/bin/env python3
"""
Seed script to populate common merit badges in the database.
Focuses on outdoor and camping-related merit badges.

NOTE: This script is now OPTIONAL. The data is automatically seeded via
the migration file: migrations/20251124_seed_merit_badges.sql

Only use this script if you need to re-seed data or are not using Atlas migrations.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.requirement import MeritBadge


# Common merit badges relevant to camping and outdoor activities
MERIT_BADGES = [
    {
        "name": "Camping",
        "description": "Camping is one of the best-known methods of the Scouting movement. Learn about different types of camping, equipment, and outdoor skills.",
        "keywords": ["camping", "outdoor", "tent", "backpacking", "overnight", "site", "gear"]
    },
    {
        "name": "Hiking",
        "description": "Hiking teaches outdoor skills and develops fitness through trail experiences. Learn to plan and execute safe hikes.",
        "keywords": ["hiking", "trail", "backpacking", "outdoor", "navigation", "map", "compass"]
    },
    {
        "name": "Backpacking",
        "description": "Backpacking combines camping and hiking skills for multi-day wilderness trips. Learn about lightweight gear and backcountry techniques.",
        "keywords": ["backpacking", "hiking", "camping", "wilderness", "overnight", "trail", "gear"]
    },
    {
        "name": "Cooking",
        "description": "Learn to prepare nutritious meals using various cooking methods, including outdoor and camp cooking techniques.",
        "keywords": ["cooking", "food", "meal", "preparation", "camping", "fire", "stove"]
    },
    {
        "name": "First Aid",
        "description": "First aid is essential for responding to injuries and emergencies. Learn to provide immediate care until professional help arrives.",
        "keywords": ["first", "aid", "medical", "emergency", "safety", "injury", "cpr"]
    },
    {
        "name": "Emergency Preparedness",
        "description": "Learn how to prepare for and respond to various emergencies, both natural and man-made.",
        "keywords": ["emergency", "preparedness", "safety", "disaster", "first", "aid", "rescue"]
    },
    {
        "name": "Wilderness Survival",
        "description": "Learn essential survival skills for the wilderness, including shelter building, fire making, and finding water.",
        "keywords": ["survival", "wilderness", "shelter", "fire", "water", "emergency", "outdoor"]
    },
    {
        "name": "Pioneering",
        "description": "Learn to use rope, knots, and lashings to build camp structures and gadgets using traditional Scout pioneering skills.",
        "keywords": ["pioneering", "lashing", "rope", "knot", "camping", "gadget", "structure"]
    },
    {
        "name": "Orienteering",
        "description": "Master the use of map and compass to navigate through unfamiliar territory. Learn orienteering competition techniques.",
        "keywords": ["orienteering", "navigation", "map", "compass", "hiking", "outdoor"]
    },
    {
        "name": "Weather",
        "description": "Learn to observe, predict, and understand weather patterns. Essential for safe outdoor activities.",
        "keywords": ["weather", "forecast", "outdoor", "safety", "camping", "hiking"]
    },
    {
        "name": "Environmental Science",
        "description": "Study the environment and learn about conservation, pollution, and protecting natural resources.",
        "keywords": ["environment", "conservation", "nature", "outdoor", "ecology", "wildlife"]
    },
    {
        "name": "Nature",
        "description": "Learn about plants, animals, and ecosystems in your local area. Develop observation skills and appreciation for nature.",
        "keywords": ["nature", "plants", "animals", "wildlife", "outdoor", "ecology"]
    },
    {
        "name": "Forestry",
        "description": "Learn about forest management, tree identification, and the importance of forests to the environment.",
        "keywords": ["forestry", "trees", "forest", "nature", "conservation", "outdoor"]
    },
    {
        "name": "Fishing",
        "description": "Learn fishing techniques, equipment, and conservation. Includes fly fishing and different fishing methods.",
        "keywords": ["fishing", "water", "outdoor", "nature", "camping"]
    },
    {
        "name": "Swimming",
        "description": "Learn essential swimming skills, water safety, and rescue techniques for aquatic activities.",
        "keywords": ["swimming", "water", "safety", "aquatic", "rescue"]
    },
    {
        "name": "Canoeing",
        "description": "Learn to paddle, maneuver, and safely operate a canoe. Includes flatwater and moving water techniques.",
        "keywords": ["canoeing", "paddling", "water", "boat", "outdoor", "camping"]
    },
    {
        "name": "Kayaking",
        "description": "Learn kayaking skills including paddling techniques, safety, and maneuvering in various water conditions.",
        "keywords": ["kayaking", "paddling", "water", "boat", "outdoor"]
    },
    {
        "name": "Rowing",
        "description": "Learn rowing techniques, boat handling, and water safety in rowing craft.",
        "keywords": ["rowing", "boat", "water", "outdoor"]
    },
    {
        "name": "Lifesaving",
        "description": "Learn water rescue techniques and how to save lives in aquatic emergencies.",
        "keywords": ["lifesaving", "rescue", "water", "safety", "swimming", "emergency"]
    },
    {
        "name": "Climbing",
        "description": "Learn rock climbing techniques, safety procedures, and equipment use for climbing activities.",
        "keywords": ["climbing", "rock", "outdoor", "safety", "rope"]
    },
    {
        "name": "Cycling",
        "description": "Learn bicycle safety, maintenance, and touring techniques for cycling activities.",
        "keywords": ["cycling", "bike", "riding", "outdoor", "touring"]
    },
    {
        "name": "Snow Sports",
        "description": "Learn skiing, snowboarding, or snowshoeing techniques and winter outdoor safety.",
        "keywords": ["snow", "skiing", "winter", "outdoor", "cold", "weather"]
    },
    {
        "name": "Geocaching",
        "description": "Learn to use GPS technology for treasure hunting and outdoor navigation activities.",
        "keywords": ["geocaching", "gps", "navigation", "outdoor", "hiking"]
    },
    {
        "name": "Astronomy",
        "description": "Learn about stars, planets, and celestial objects. Great for camping under the stars.",
        "keywords": ["astronomy", "stars", "sky", "night", "camping", "outdoor"]
    },
    {
        "name": "Mammal Study",
        "description": "Learn to identify and observe mammals in their natural habitats.",
        "keywords": ["mammals", "wildlife", "nature", "outdoor", "animals"]
    },
    {
        "name": "Bird Study",
        "description": "Learn bird identification, observation techniques, and avian ecology.",
        "keywords": ["birds", "wildlife", "nature", "outdoor", "animals"]
    },
    {
        "name": "Insect Study",
        "description": "Study insects and their role in the ecosystem through collection and observation.",
        "keywords": ["insects", "bugs", "nature", "outdoor", "wildlife"]
    },
    {
        "name": "Reptile and Amphibian Study",
        "description": "Learn about reptiles and amphibians, their habitats, and conservation.",
        "keywords": ["reptiles", "amphibians", "wildlife", "nature", "outdoor", "animals"]
    },
    {
        "name": "Plant Science",
        "description": "Study plant biology, identification, and the role of plants in ecosystems.",
        "keywords": ["plants", "nature", "outdoor", "botany", "ecology"]
    },
    {
        "name": "Soil and Water Conservation",
        "description": "Learn about soil erosion, water quality, and conservation practices.",
        "keywords": ["conservation", "water", "soil", "environment", "outdoor", "ecology"]
    },
]


def seed_merit_badges(db: Session):
    """Seed merit badges into the database"""
    print("Seeding merit badges...")
    
    for badge_data in MERIT_BADGES:
        # Check if badge already exists
        existing = db.query(MeritBadge).filter(
            MeritBadge.name == badge_data["name"]
        ).first()
        
        if existing:
            print(f"  Skipping {badge_data['name']} - already exists")
            continue
        
        # Create new merit badge
        badge = MeritBadge(
            name=badge_data["name"],
            description=badge_data["description"],
            keywords=badge_data["keywords"]
        )
        
        db.add(badge)
        print(f"  Added {badge_data['name']}")
    
    db.commit()
    print(f"\nSuccessfully seeded {len(MERIT_BADGES)} merit badges!")


def main():
    """Main function to run the seed script"""
    print("=" * 80)
    print("Merit Badges Seed Script")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        seed_merit_badges(db)
    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("\nDone!")


if __name__ == "__main__":
    main()

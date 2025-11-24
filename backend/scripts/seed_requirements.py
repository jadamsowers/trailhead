#!/usr/bin/env python3
"""
Seed script to populate rank requirements in the database.
This includes Scout, Tenderfoot, Second Class, and First Class requirements.

NOTE: This script is now OPTIONAL. The data is automatically seeded via
the migration file: migrations/20251124_seed_rank_requirements.sql

Only use this script if you need to re-seed data or are not using Atlas migrations.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.requirement import RankRequirement
from app.schemas.requirement import RankRequirementCreate


# Scout Rank Requirements (selected camping/outdoor-related ones)
SCOUT_REQUIREMENTS = [
    {
        "rank": "Scout",
        "requirement_number": "3a",
        "requirement_text": "Repeat from memory the Outdoor Code. In your own words, explain what the Outdoor Code means to you.",
        "keywords": ["outdoor", "code", "leave", "trace", "conservation"],
        "category": "Outdoor Ethics"
    },
    {
        "rank": "Scout",
        "requirement_number": "3b",
        "requirement_text": "Repeat from memory the Principles of Leave No Trace. In your own words, explain what the principles mean to you.",
        "keywords": ["lnt", "leave", "trace", "outdoor", "ethics", "conservation", "camping"],
        "category": "Outdoor Ethics"
    },
]

# Tenderfoot Requirements (camping/outdoor-related)
TENDERFOOT_REQUIREMENTS = [
    {
        "rank": "Tenderfoot",
        "requirement_number": "1a",
        "requirement_text": "Present yourself to your leader, properly dressed, before going on an overnight camping trip. Show the camping gear you will use. Show the right way to pack and carry it.",
        "keywords": ["camping", "gear", "packing", "overnight"],
        "category": "Camping"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "1b",
        "requirement_text": "Spend at least one night on a patrol or troop campout. Sleep in a tent you have helped pitch.",
        "keywords": ["camping", "overnight", "tent", "patrol"],
        "category": "Camping"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "1c",
        "requirement_text": "Tell how you practiced the Principles of Leave No Trace on a campout or outing.",
        "keywords": ["leave", "trace", "camping", "outdoor", "ethics"],
        "category": "Outdoor Ethics"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "2a",
        "requirement_text": "On the campout, assist in preparing one of the meals. Tell why it is important for each patrol member to share in meal preparation and cleanup.",
        "keywords": ["cooking", "meal", "camping", "preparation", "food"],
        "category": "Cooking"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "2b",
        "requirement_text": "While on a campout, demonstrate the appropriate method of safely cleaning items used to prepare, serve, and eat a meal.",
        "keywords": ["cooking", "camping", "cleaning", "food", "safety"],
        "category": "Cooking"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "2c",
        "requirement_text": "Explain the importance of eating together as a patrol.",
        "keywords": ["patrol", "camping", "meal", "cooking"],
        "category": "Cooking"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "4a",
        "requirement_text": "Show first aid for the following: simple cuts and scrapes, blisters on the hand and foot, minor thermal/heat burns or scalds (first-degree), bites or stings of insects and ticks, poisonous plants, nosebleed, frostbite and sunburn.",
        "keywords": ["first", "aid", "safety", "medical", "injury", "outdoor"],
        "category": "First Aid"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "5a",
        "requirement_text": "Demonstrate a practical use of the square knot.",
        "keywords": ["knot", "rope", "camping", "lashing"],
        "category": "Camping Skills"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "5b",
        "requirement_text": "Demonstrate a practical use of two half-hitches.",
        "keywords": ["knot", "rope", "camping", "lashing"],
        "category": "Camping Skills"
    },
    {
        "rank": "Tenderfoot",
        "requirement_number": "5c",
        "requirement_text": "Demonstrate a practical use of the taut-line hitch.",
        "keywords": ["knot", "rope", "camping", "lashing", "tent"],
        "category": "Camping Skills"
    },
]

# Second Class Requirements (camping/outdoor-related)
SECOND_CLASS_REQUIREMENTS = [
    {
        "rank": "Second Class",
        "requirement_number": "1a",
        "requirement_text": "Since joining Scouts BSA, participate in five separate troop/patrol activities, at least three of which must be held outdoors. Of the outdoor activities, at least two must include overnight camping.",
        "keywords": ["camping", "overnight", "outdoor", "patrol", "activities"],
        "category": "Camping"
    },
    {
        "rank": "Second Class",
        "requirement_number": "2a",
        "requirement_text": "Demonstrate how to find directions during the day and at night without using a compass or an electronic device.",
        "keywords": ["navigation", "outdoor", "hiking", "compass", "direction"],
        "category": "Navigation"
    },
    {
        "rank": "Second Class",
        "requirement_number": "2b",
        "requirement_text": "Using a compass, complete an orienteering course that covers at least one mile and requires measuring the height and/or width of designated items.",
        "keywords": ["navigation", "compass", "orienteering", "hiking", "outdoor"],
        "category": "Navigation"
    },
    {
        "rank": "Second Class",
        "requirement_number": "3a",
        "requirement_text": "Demonstrate how a compass works and how to orient a map. Use a map to point out and tell the meaning of five map symbols.",
        "keywords": ["navigation", "compass", "map", "hiking", "outdoor"],
        "category": "Navigation"
    },
    {
        "rank": "Second Class",
        "requirement_number": "3b",
        "requirement_text": "Using a compass and map together, take a 5-mile hike (or 10 miles by bike) approved by your adult leader and your parent or guardian.",
        "keywords": ["hiking", "navigation", "compass", "map", "outdoor", "backpacking"],
        "category": "Hiking"
    },
    {
        "rank": "Second Class",
        "requirement_number": "3c",
        "requirement_text": "Describe some hazards or injuries that you might encounter on your hike and what you can do to help prevent them.",
        "keywords": ["hiking", "safety", "first", "aid", "outdoor"],
        "category": "First Aid"
    },
    {
        "rank": "Second Class",
        "requirement_number": "3d",
        "requirement_text": "Demonstrate how to transport, store, and prepare foods on a campout.",
        "keywords": ["cooking", "camping", "food", "preparation", "storage"],
        "category": "Cooking"
    },
    {
        "rank": "Second Class",
        "requirement_number": "5a",
        "requirement_text": "Explain when it is appropriate to use a fire for cooking or other purposes and when it would not be appropriate to do so.",
        "keywords": ["fire", "cooking", "camping", "safety", "leave", "trace"],
        "category": "Camping Skills"
    },
    {
        "rank": "Second Class",
        "requirement_number": "5b",
        "requirement_text": "Use the tools listed in Tenderfoot requirement 3d to prepare tinder, kindling, and fuel wood for a cooking fire.",
        "keywords": ["fire", "camping", "wood", "cooking"],
        "category": "Camping Skills"
    },
    {
        "rank": "Second Class",
        "requirement_number": "5c",
        "requirement_text": "Demonstrate how to build a fire; light the fire, unless prohibited by local fire restrictions. After allowing the flames to burn safely for at least two minutes, safely extinguish the flames with minimal impact to the fire site.",
        "keywords": ["fire", "camping", "safety", "cooking"],
        "category": "Camping Skills"
    },
    {
        "rank": "Second Class",
        "requirement_number": "6a",
        "requirement_text": "On one of these campouts, select a location for your patrol site and recommend it to your patrol leader, senior patrol leader, or troop guide. Explain what factors you should consider when choosing a patrol site and where to pitch a tent.",
        "keywords": ["camping", "tent", "site", "patrol"],
        "category": "Camping"
    },
    {
        "rank": "Second Class",
        "requirement_number": "6b",
        "requirement_text": "Demonstrate proper care, sharpening, and use of the knife, saw, and ax. Describe when each should be used.",
        "keywords": ["knife", "saw", "ax", "camping", "safety", "tools"],
        "category": "Camping Skills"
    },
]

# First Class Requirements (camping/outdoor-related)
FIRST_CLASS_REQUIREMENTS = [
    {
        "rank": "First Class",
        "requirement_number": "1a",
        "requirement_text": "Since joining Scouts BSA, participate in 10 separate troop/patrol activities, at least six of which must be held outdoors. Of the outdoor activities, at least three must include overnight camping.",
        "keywords": ["camping", "overnight", "outdoor", "patrol", "activities"],
        "category": "Camping"
    },
    {
        "rank": "First Class",
        "requirement_number": "3a",
        "requirement_text": "Discuss when you should and should not use lashings.",
        "keywords": ["lashing", "camping", "pioneering", "rope"],
        "category": "Camping Skills"
    },
    {
        "rank": "First Class",
        "requirement_number": "3b",
        "requirement_text": "Demonstrate tying the timber hitch and clove hitch.",
        "keywords": ["knot", "lashing", "camping", "rope"],
        "category": "Camping Skills"
    },
    {
        "rank": "First Class",
        "requirement_number": "3c",
        "requirement_text": "Demonstrate tying the square, shear, and diagonal lashings by joining two or more poles or staves together.",
        "keywords": ["lashing", "camping", "pioneering", "rope"],
        "category": "Camping Skills"
    },
    {
        "rank": "First Class",
        "requirement_number": "3d",
        "requirement_text": "Use lashing to make a useful camp gadget or structure.",
        "keywords": ["lashing", "camping", "pioneering", "gadget"],
        "category": "Camping Skills"
    },
    {
        "rank": "First Class",
        "requirement_number": "4a",
        "requirement_text": "Using a map and compass, complete an orienteering course that covers at least one mile and requires measuring the height and/or width of designated items.",
        "keywords": ["navigation", "compass", "map", "orienteering", "hiking"],
        "category": "Navigation"
    },
    {
        "rank": "First Class",
        "requirement_number": "4b",
        "requirement_text": "Demonstrate how to use a handheld GPS unit, GPS app on a smartphone, or other electronic navigation system. Use GPS to find your current location, a destination of your choice, and the route you will take to get there. Follow that route to arrive at your destination.",
        "keywords": ["navigation", "gps", "hiking", "outdoor"],
        "category": "Navigation"
    },
    {
        "rank": "First Class",
        "requirement_number": "5a",
        "requirement_text": "Identify or show evidence of at least 10 kinds of native plants found in your local area or campsite location.",
        "keywords": ["nature", "plants", "outdoor", "camping", "hiking"],
        "category": "Nature"
    },
    {
        "rank": "First Class",
        "requirement_number": "5b",
        "requirement_text": "Identify two ways to obtain a weather forecast for an upcoming activity. Explain why weather forecasts are important when planning for an event.",
        "keywords": ["weather", "outdoor", "camping", "hiking", "safety"],
        "category": "Outdoor Skills"
    },
    {
        "rank": "First Class",
        "requirement_number": "6a",
        "requirement_text": "Successfully complete your current requirements for Tenderfoot, Second Class, and First Class ranks. Obtain information from at least one BSA Scout appropriate resource and use information you have learned to plan and carry out at least three camping trips.",
        "keywords": ["camping", "planning", "outdoor"],
        "category": "Camping"
    },
    {
        "rank": "First Class",
        "requirement_number": "7a",
        "requirement_text": "Discuss Leave No Trace with respect to camping. Explain how the Outdoor Code and Leave No Trace principles relate to your own camp cleanup.",
        "keywords": ["leave", "trace", "camping", "outdoor", "ethics", "conservation"],
        "category": "Outdoor Ethics"
    },
    {
        "rank": "First Class",
        "requirement_number": "7b",
        "requirement_text": "While on a campout, demonstrate appropriate methods for dealing with human and other waste, and explain to your patrol or troop what happens to waste when the campsite has no toilets.",
        "keywords": ["camping", "sanitation", "leave", "trace", "outdoor"],
        "category": "Camping"
    },
    {
        "rank": "First Class",
        "requirement_number": "8a",
        "requirement_text": "After eating a meal, wash and store cooking gear in the proper manner.",
        "keywords": ["cooking", "camping", "cleaning", "food"],
        "category": "Cooking"
    },
    {
        "rank": "First Class",
        "requirement_number": "9a",
        "requirement_text": "Demonstrate bandages for a sprained ankle and for injuries on the head, the upper arm, and the collarbone.",
        "keywords": ["first", "aid", "medical", "injury", "safety"],
        "category": "First Aid"
    },
    {
        "rank": "First Class",
        "requirement_number": "9b",
        "requirement_text": "Show how to transport a person from a smoke-filled room; transport for at least 25 yards a person with a sprained ankle.",
        "keywords": ["first", "aid", "safety", "emergency", "rescue"],
        "category": "First Aid"
    },
    {
        "rank": "First Class",
        "requirement_number": "9c",
        "requirement_text": "Tell what you can do while on a campout or other outdoor activity to prevent or reduce the occurrence of injuries or exposure listed in Tenderfoot requirement 4a and Second Class requirement 5a.",
        "keywords": ["first", "aid", "safety", "camping", "outdoor", "prevention"],
        "category": "First Aid"
    },
]


def seed_rank_requirements(db: Session):
    """Seed rank requirements into the database"""
    print("Seeding rank requirements...")
    
    all_requirements = (
        SCOUT_REQUIREMENTS +
        TENDERFOOT_REQUIREMENTS +
        SECOND_CLASS_REQUIREMENTS +
        FIRST_CLASS_REQUIREMENTS
    )
    
    for req_data in all_requirements:
        # Check if requirement already exists
        existing = db.query(RankRequirement).filter(
            RankRequirement.rank == req_data["rank"],
            RankRequirement.requirement_number == req_data["requirement_number"]
        ).first()
        
        if existing:
            print(f"  Skipping {req_data['rank']} {req_data['requirement_number']} - already exists")
            continue
        
        # Create new requirement
        requirement = RankRequirement(
            rank=req_data["rank"],
            requirement_number=req_data["requirement_number"],
            requirement_text=req_data["requirement_text"],
            keywords=req_data["keywords"],
            category=req_data["category"]
        )
        
        db.add(requirement)
        print(f"  Added {req_data['rank']} {req_data['requirement_number']}: {req_data['category']}")
    
    db.commit()
    print(f"\nSuccessfully seeded {len(all_requirements)} rank requirements!")


def main():
    """Main function to run the seed script"""
    print("=" * 80)
    print("Rank Requirements Seed Script")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        seed_rank_requirements(db)
    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
        raise
    finally:
        db.close()
    
    print("\nDone!")


if __name__ == "__main__":
    main()

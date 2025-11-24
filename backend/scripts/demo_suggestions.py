#!/usr/bin/env python3
"""
Demo script to show the scouting requirements feature in action.
This demonstrates how the suggestion engine works.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.utils.suggestions import extract_keywords_from_text, calculate_match_score


def demo_keyword_extraction():
    """Demonstrate keyword extraction from outing descriptions"""
    print("=" * 80)
    print("DEMO 1: Keyword Extraction")
    print("=" * 80)
    
    examples = [
        "Weekend Camping at Pine Lake",
        "Advanced Backpacking - 3 Day Wilderness Trek",
        "Dutch Oven Cooking Workshop",
        "Map and Compass Orienteering Challenge",
        "Winter Camping and Snow Survival Skills"
    ]
    
    for outing in examples:
        keywords = extract_keywords_from_text(outing)
        print(f"\nOuting: {outing}")
        print(f"Keywords: {', '.join(sorted(keywords))}")


def demo_requirement_matching():
    """Demonstrate how requirements are matched to outings"""
    print("\n" + "=" * 80)
    print("DEMO 2: Requirement Matching")
    print("=" * 80)
    
    # Sample outing
    outing = {
        "name": "Fall Camping Weekend",
        "description": "Overnight camping trip. Practice setting up tents, cooking over campfire, and basic camping skills."
    }
    
    # Sample requirements
    requirements = [
        {
            "id": "T1b",
            "text": "Spend at least one night on a patrol or troop campout. Sleep in a tent you have helped pitch.",
            "keywords": ["camping", "overnight", "tent", "patrol"]
        },
        {
            "id": "T2a",
            "text": "On the campout, assist in preparing one of the meals.",
            "keywords": ["cooking", "meal", "camping", "preparation", "food"]
        },
        {
            "id": "SC3b",
            "text": "Using a compass and map together, take a 5-mile hike",
            "keywords": ["hiking", "navigation", "compass", "map", "outdoor"]
        }
    ]
    
    # Extract keywords from outing
    outing_text = f"{outing['name']} {outing['description']}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    print(f"\nOuting: {outing['name']}")
    print(f"Description: {outing['description']}")
    print(f"Extracted Keywords: {', '.join(sorted(outing_keywords))}")
    print("\nMatching Requirements:")
    print("-" * 80)
    
    matches = []
    for req in requirements:
        score, matched = calculate_match_score(req['keywords'], outing_keywords)
        matches.append((req, score, matched))
    
    # Sort by score
    matches.sort(key=lambda x: x[1], reverse=True)
    
    for req, score, matched in matches:
        if score > 0:
            print(f"\n[{req['id']}] Match Score: {score:.1%}")
            print(f"Text: {req['text']}")
            print(f"Matched Keywords: {', '.join(matched)}")


def demo_merit_badge_matching():
    """Demonstrate merit badge matching"""
    print("\n" + "=" * 80)
    print("DEMO 3: Merit Badge Matching")
    print("=" * 80)
    
    # Sample outing
    outing = {
        "name": "Wilderness Backpacking Adventure",
        "description": "3-day backpacking trip through mountain wilderness. Learn navigation, wilderness survival, and Leave No Trace principles."
    }
    
    # Sample merit badges
    badges = [
        {
            "name": "Camping",
            "keywords": ["camping", "outdoor", "tent", "backpacking", "overnight"]
        },
        {
            "name": "Hiking",
            "keywords": ["hiking", "trail", "backpacking", "outdoor", "navigation"]
        },
        {
            "name": "Backpacking",
            "keywords": ["backpacking", "hiking", "camping", "wilderness", "overnight", "trail"]
        },
        {
            "name": "Orienteering",
            "keywords": ["navigation", "map", "compass", "orienteering", "hiking"]
        },
        {
            "name": "Wilderness Survival",
            "keywords": ["survival", "wilderness", "emergency", "outdoor", "shelter"]
        },
        {
            "name": "Cooking",
            "keywords": ["cooking", "food", "meal", "preparation", "camping"]
        }
    ]
    
    # Extract keywords from outing
    outing_text = f"{outing['name']} {outing['description']}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    print(f"\nOuting: {outing['name']}")
    print(f"Description: {outing['description']}")
    print(f"Extracted Keywords: {', '.join(sorted(outing_keywords))}")
    print("\nMatching Merit Badges:")
    print("-" * 80)
    
    matches = []
    for badge in badges:
        score, matched = calculate_match_score(badge['keywords'], outing_keywords)
        matches.append((badge, score, matched))
    
    # Sort by score
    matches.sort(key=lambda x: x[1], reverse=True)
    
    for badge, score, matched in matches:
        if score > 0:
            print(f"\n{badge['name']}: {score:.1%} match")
            print(f"Matched Keywords: {', '.join(matched)}")


def main():
    """Run all demos"""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "SCOUTING REQUIREMENTS DEMO" + " " * 32 + "║")
    print("╚" + "═" * 78 + "╝")
    
    demo_keyword_extraction()
    demo_requirement_matching()
    demo_merit_badge_matching()
    
    print("\n" + "=" * 80)
    print("Demo Complete!")
    print("=" * 80)
    print("\nThis demonstrates how the suggestion engine:")
    print("  1. Extracts keywords from outing names and descriptions")
    print("  2. Matches keywords against rank requirements")
    print("  3. Matches keywords against merit badges")
    print("  4. Calculates relevance scores for each match")
    print("\nAPI Endpoint: GET /api/v1/outings/{outing_id}/suggestions")
    print("=" * 80)
    print()


if __name__ == "__main__":
    main()

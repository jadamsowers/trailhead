"""
Test cases for the scouting requirements suggestion engine
"""

import pytest
from app.utils.suggestions import (
    extract_keywords_from_text,
    calculate_match_score,
)


def test_extract_keywords_basic():
    """Test basic keyword extraction"""
    text = "Weekend camping trip at Big Bear Lake"
    keywords = extract_keywords_from_text(text)
    
    assert "weekend" in keywords
    assert "camping" in keywords
    assert "trip" in keywords
    assert "big" in keywords
    assert "bear" in keywords
    assert "lake" in keywords
    
    # Stop words should be filtered out
    assert "at" not in keywords


def test_extract_keywords_empty():
    """Test keyword extraction with empty or None text"""
    assert extract_keywords_from_text("") == []
    assert extract_keywords_from_text(None) == []


def test_extract_keywords_with_description():
    """Test keyword extraction from longer description"""
    text = """
    Join us for a challenging backpacking adventure! 
    We'll hike 10 miles through the wilderness, 
    practice orienteering with map and compass,
    and cook meals over a campfire.
    """
    keywords = extract_keywords_from_text(text)
    
    # Should extract relevant outdoor keywords
    assert "backpacking" in keywords
    assert "adventure" in keywords
    assert "hike" in keywords
    assert "wilderness" in keywords
    assert "orienteering" in keywords
    assert "compass" in keywords
    assert "cook" in keywords
    assert "campfire" in keywords
    
    # Should filter out common stop words
    assert "the" not in keywords
    assert "and" not in keywords
    assert "for" not in keywords


def test_calculate_match_score_perfect_match():
    """Test match score calculation with perfect overlap"""
    req_keywords = ["camping", "hiking", "outdoor"]
    outing_keywords = ["camping", "hiking", "outdoor", "weekend"]
    
    score, matched = calculate_match_score(req_keywords, outing_keywords)
    
    assert score == 1.0  # All requirement keywords matched
    assert set(matched) == {"camping", "hiking", "outdoor"}


def test_calculate_match_score_partial_match():
    """Test match score with partial keyword overlap"""
    req_keywords = ["camping", "hiking", "outdoor", "wilderness"]
    outing_keywords = ["camping", "hiking", "weekend"]
    
    score, matched = calculate_match_score(req_keywords, outing_keywords)
    
    assert score == 0.5  # 2 out of 4 keywords matched
    assert set(matched) == {"camping", "hiking"}


def test_calculate_match_score_no_match():
    """Test match score with no overlap"""
    req_keywords = ["swimming", "water", "pool"]
    outing_keywords = ["camping", "hiking", "outdoor"]
    
    score, matched = calculate_match_score(req_keywords, outing_keywords)
    
    assert score == 0.0
    assert matched == []


def test_calculate_match_score_empty_keywords():
    """Test match score with empty keyword lists"""
    score, matched = calculate_match_score([], ["camping"])
    assert score == 0.0
    assert matched == []
    
    score, matched = calculate_match_score(["camping"], [])
    assert score == 0.0
    assert matched == []


def test_calculate_match_score_case_sensitivity():
    """Test that matching is case-insensitive through keyword extraction"""
    # Keywords should be normalized to lowercase during extraction
    text1 = "CAMPING and HIKING"
    text2 = "camping and hiking"
    
    keywords1 = extract_keywords_from_text(text1)
    keywords2 = extract_keywords_from_text(text2)
    
    assert keywords1 == keywords2
    assert "camping" in keywords1
    assert "hiking" in keywords1


def test_realistic_camping_outing():
    """Test realistic camping outing suggestion scenario"""
    outing_name = "Fall Camping Weekend at Pine Lake"
    outing_description = """
    Join us for an overnight camping trip! 
    Scouts will practice setting up tents, cooking over a campfire,
    and learn basic camping skills. Great opportunity for 
    Tenderfoot and Second Class requirements.
    """
    
    # Extract keywords from outing
    outing_text = f"{outing_name} {outing_description}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    # Simulate Tenderfoot 1b requirement
    req_keywords = ["camping", "overnight", "tent", "patrol"]
    score, matched = calculate_match_score(req_keywords, outing_keywords)
    
    # Should have good match (camping, overnight, tent all present)
    assert score >= 0.5
    assert "camping" in matched
    assert "overnight" in matched
    assert "tent" in matched or "tents" in matched


def test_realistic_hiking_outing():
    """Test realistic hiking outing suggestion scenario"""
    outing_name = "Mount Wilson Summit Hike"
    outing_description = """
    Challenging 14-mile hike with 2000 feet elevation gain.
    Bring map, compass, and plenty of water. 
    We'll practice navigation and learn about Leave No Trace.
    """
    
    outing_text = f"{outing_name} {outing_description}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    # Simulate Second Class 3b requirement (5-mile hike with map/compass)
    req_keywords = ["hiking", "navigation", "compass", "map", "outdoor"]
    score, matched = calculate_match_score(req_keywords, outing_keywords)
    
    # Should have good match
    assert score >= 0.6
    assert "hiking" in matched or "hike" in matched
    assert "compass" in matched
    assert "map" in matched
    assert "navigation" in matched


def test_realistic_cooking_outing():
    """Test outing focused on cooking merit badge"""
    outing_name = "Dutch Oven Cooking Workshop"
    outing_description = """
    Learn outdoor cooking techniques with Dutch ovens.
    Plan and prepare meals, practice food safety,
    and work on Cooking merit badge requirements.
    """
    
    outing_text = f"{outing_name} {outing_description}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    # Simulate Cooking merit badge keywords
    badge_keywords = ["cooking", "food", "meal", "preparation", "camping"]
    score, matched = calculate_match_score(badge_keywords, outing_keywords)
    
    # Should have excellent match
    assert score >= 0.5
    assert "cooking" in matched
    assert "food" in matched
    assert "meal" in matched or "meals" in matched

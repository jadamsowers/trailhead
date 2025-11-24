from sqlalchemy.orm import Session
from typing import List, Tuple
import re

from app.models.outing import Outing
from app.models.requirement import RankRequirement, MeritBadge
from app.crud import requirement as crud_requirement
from app.schemas.requirement import RequirementSuggestion, MeritBadgeSuggestion, OutingSuggestions


def extract_keywords_from_text(text: str) -> List[str]:
    """Extract potential keywords from outing name and description"""
    if not text:
        return []
    
    # Convert to lowercase and split into words
    words = re.findall(r'\b[a-z]+\b', text.lower())
    
    # Filter out common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
        'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
        'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
        'just', 'should', 'now', 'our', 'we', 'us', 'be', 'is', 'are', 'was', 'were',
        'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
        'this', 'that', 'these', 'those'
    }
    
    # Return unique keywords, excluding stop words
    return list(set(word for word in words if word not in stop_words and len(word) > 2))


def calculate_match_score(
    requirement_keywords: List[str],
    outing_keywords: List[str]
) -> Tuple[float, List[str]]:
    """
    Calculate match score between requirement keywords and outing keywords
    Returns (score, matched_keywords)
    """
    if not requirement_keywords or not outing_keywords:
        return 0.0, []
    
    # Convert to sets for efficient intersection
    req_set = set(requirement_keywords)
    out_set = set(outing_keywords)
    
    # Find matching keywords
    matched = req_set.intersection(out_set)
    
    if not matched:
        return 0.0, []
    
    # Calculate score based on percentage of requirement keywords matched
    score = len(matched) / len(req_set)
    
    return score, list(matched)


def get_requirement_suggestions(
    db: Session,
    outing: Outing,
    min_score: float = 0.1,
    max_results: int = 10
) -> List[RequirementSuggestion]:
    """
    Get suggested rank requirements for an outing based on keywords
    
    Args:
        db: Database session
        outing: Outing to get suggestions for
        min_score: Minimum match score to include (0-1)
        max_results: Maximum number of suggestions to return
    
    Returns:
        List of requirement suggestions sorted by relevance
    """
    # Extract keywords from outing name and description
    outing_text = f"{outing.name} {outing.description or ''}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    if not outing_keywords:
        return []
    
    # Search for requirements with matching keywords
    all_requirements = crud_requirement.search_rank_requirements_by_keywords(
        db, outing_keywords
    )
    
    suggestions = []
    for requirement in all_requirements:
        if not requirement.keywords:
            continue
        
        score, matched = calculate_match_score(
            requirement.keywords,
            outing_keywords
        )
        
        if score >= min_score:
            suggestions.append(
                RequirementSuggestion(
                    requirement=requirement,
                    match_score=score,
                    matched_keywords=matched
                )
            )
    
    # Sort by score (highest first) and limit results
    suggestions.sort(key=lambda x: x.match_score, reverse=True)
    return suggestions[:max_results]


def get_merit_badge_suggestions(
    db: Session,
    outing: Outing,
    min_score: float = 0.1,
    max_results: int = 10
) -> List[MeritBadgeSuggestion]:
    """
    Get suggested merit badges for an outing based on keywords
    
    Args:
        db: Database session
        outing: Outing to get suggestions for
        min_score: Minimum match score to include (0-1)
        max_results: Maximum number of suggestions to return
    
    Returns:
        List of merit badge suggestions sorted by relevance
    """
    # Extract keywords from outing name and description
    outing_text = f"{outing.name} {outing.description or ''}"
    outing_keywords = extract_keywords_from_text(outing_text)
    
    if not outing_keywords:
        return []
    
    # Search for merit badges with matching keywords
    all_badges = crud_requirement.search_merit_badges_by_keywords(
        db, outing_keywords
    )
    
    suggestions = []
    for badge in all_badges:
        if not badge.keywords:
            continue
        
        score, matched = calculate_match_score(
            badge.keywords,
            outing_keywords
        )
        
        if score >= min_score:
            suggestions.append(
                MeritBadgeSuggestion(
                    merit_badge=badge,
                    match_score=score,
                    matched_keywords=matched
                )
            )
    
    # Sort by score (highest first) and limit results
    suggestions.sort(key=lambda x: x.match_score, reverse=True)
    return suggestions[:max_results]


def get_outing_suggestions(
    db: Session,
    outing: Outing,
    min_score: float = 0.1,
    max_requirements: int = 10,
    max_merit_badges: int = 10
) -> OutingSuggestions:
    """
    Get all suggestions (requirements and merit badges) for an outing
    
    Args:
        db: Database session
        outing: Outing to get suggestions for
        min_score: Minimum match score to include (0-1)
        max_requirements: Maximum number of requirement suggestions
        max_merit_badges: Maximum number of merit badge suggestions
    
    Returns:
        OutingSuggestions with both requirements and merit badges
    """
    return OutingSuggestions(
        requirements=get_requirement_suggestions(
            db, outing, min_score, max_requirements
        ),
        merit_badges=get_merit_badge_suggestions(
            db, outing, min_score, max_merit_badges
        )
    )

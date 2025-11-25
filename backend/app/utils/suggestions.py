from sqlalchemy.orm import Session
from typing import List, Tuple
import re

from app.models.outing import Outing
from app.models.requirement import RankRequirement, MeritBadge
from app.crud import requirement as crud_requirement
from app.schemas.requirement import RequirementSuggestion, MeritBadgeSuggestion, OutingSuggestions

DOMAIN_STOPWORDS = {
    # Generic words that appeared frequently and reduced precision
    'badge', 'merit', 'learn', 'learning', 'including', 'activities', 'activity'
    # NOTE: retain 'outdoor', 'outdoors', 'skill', 'skills' for matching; previously removed
}


def extract_keywords_from_text(text: str) -> List[str]:
    """Extract potential keywords from outing name and description with normalization.
    Enhancements:
    - Preserve outdoor-related tokens for matching (removed from DOMAIN_STOPWORDS).
    - Normalize curly apostrophes and unicode dashes.
    - Include alphanumeric tokens (e.g. 5-mile -> 5, mile) and simple stemming for 'ing' suffix.
    - Split hyphenated words into components.
    """
    if not text:
        return []

    normalized = (
        text
        .lower()
        .replace("\u2019", "'")  # curly apostrophe
        .replace("\u2018", "'")
        .replace("\u2014", "-")  # em dash
        .replace("\u2013", "-")  # en dash
    )

    # Replace non word separators with spaces for cleaner splitting
    # Keep hyphens for later splitting
    # Regex: capture words with letters/numbers/apostrophes
    raw_tokens = re.findall(r"\b[a-z0-9']+\b", normalized)

    stop_words = {
        'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during',
        'before','after','above','below','between','under','again','further','then','once','here','there','when','where','why','how','all',
        'both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will',
        'just','should','now','our','we','us','be','is','are','was','were','been','being','have','has','had','having','do','does','did','doing',
        'this','that','these','those'
    }

    refined: List[str] = []
    for token in raw_tokens:
        if token in stop_words or token in DOMAIN_STOPWORDS or len(token) <= 2:
            continue
        # Simple stemming for common 'ing' forms (e.g., hiking -> hike) if base length >2
        if token.endswith('ing') and len(token) > 5:
            base = token[:-3]
            if base not in stop_words and base not in DOMAIN_STOPWORDS and len(base) > 2:
                refined.append(base)
        # Add original token
        refined.append(token)

    return list(set(refined))


def calculate_match_score(
    requirement_keywords: List[str],
    outing_keywords: List[str]
) -> Tuple[float, List[str]]:
    """Calculate match score between requirement and outing keywords.
    New scoring strategy: score = matched / max(len(requirement_keywords), 1)
    (focus on how much of the requirement is covered by outing description).
    Returns (score, matched_keywords).
    """
    if not requirement_keywords or not outing_keywords:
        return 0.0, []

    req_set = set(requirement_keywords)
    out_set = set(outing_keywords)
    matched = req_set.intersection(out_set)
    if not matched:
        return 0.0, []
    score = len(matched) / max(len(req_set), 1)
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
                    rank=requirement.rank,
                    requirement_number=requirement.requirement_number,
                    description=requirement.requirement_text,
                    match_score=score,
                    matched_keywords=matched,
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
                    name=badge.name,
                    description=badge.description,
                    eagle_required=bool(getattr(badge, "eagle_required", False)),
                    match_score=score,
                    matched_keywords=matched,
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

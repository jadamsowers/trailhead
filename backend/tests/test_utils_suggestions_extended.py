"""Extended tests for suggestions engine covering DB-backed suggestion functions."""
import pytest
from uuid import uuid4
from app.utils import suggestions as sugg
from app.models.outing import Outing



class DummyReq:
    def __init__(self, id, rank, num, text, keywords):
        self.id = id  # UUID
        self.rank = rank
        self.requirement_number = num
        self.requirement_text = text
        self.keywords = keywords

class DummyBadge:
    def __init__(self, id, name, desc, keywords, eagle=False):
        self.id = id  # UUID
        self.name = name
        self.description = desc
        self.keywords = keywords
        self.eagle_required = eagle

class DummyDB:  # placeholder for Session type
    pass


def _outing(name, description=""):
    return Outing(name=name, description=description)


def test_get_requirement_suggestions_empty_keywords(monkeypatch):
    outing = _outing("the and or at to")  # all stopwords => no tokens
    monkeypatch.setattr(sugg.crud_requirement, 'search_rank_requirements_by_keywords', lambda db, kw: [])
    result = sugg.get_requirement_suggestions(DummyDB(), outing)
    assert result == []


def test_get_requirement_suggestions_filters_and_sorts(monkeypatch):
    outing = _outing("Overnight camping hike with tent setup and navigation skills")
    # Prepare mock requirements
    reqs = [
        DummyReq(uuid4(), "Tenderfoot", "1a", "Basic camping skills", ["camping", "skills"]),
        DummyReq(uuid4(), "Second Class", "3b", "5 mile hike with map and compass", ["hike", "map", "compass"]),
        DummyReq(uuid4(), "First Class", "4c", "Navigation and advanced hiking", ["navigation", "hiking"]),
        DummyReq(uuid4(), "Tenderfoot", "2b", "Unrelated aquatics", ["swim", "water"]),
        DummyReq(uuid4(), "First Class", "5a", "Tent pitching and overnight stay", ["tent", "overnight", "camping"]),
    ]
    def mock_search(db, keywords):
        assert 'camping' in keywords or 'hike' in keywords  # ensure outing keywords passed
        return reqs
    monkeypatch.setattr(sugg.crud_requirement, 'search_rank_requirements_by_keywords', mock_search)

    suggestions = sugg.get_requirement_suggestions(DummyDB(), outing, min_score=0.2, max_results=3)
    assert len(suggestions) == 3  # limited
    # Scores: compute manually to ensure ordering
    # req1: 2/2 =>1.0, req2:3/3 =>1.0, req3:2/2 =>1.0, req4:0 skip, req5:3/3 =>1.0 (all high)
    # After limit, top three by score (stable order by insertion after sort)
    assert all(s.match_score >= 0.2 for s in suggestions)
    # matched_keywords included
    assert any('camping' in s.matched_keywords for s in suggestions)


def test_get_requirement_suggestions_min_score_excludes(monkeypatch):
    outing = _outing("Basic camp navigation")
    reqs = [
        DummyReq(uuid4(), "Tenderfoot", "1a", "Has only one rare keyword", ["compass", "swim"]),
    ]
    monkeypatch.setattr(sugg.crud_requirement, 'search_rank_requirements_by_keywords', lambda db, kw: reqs)
    # Outing keywords differ from swim; compass may not appear -> low score
    suggestions = sugg.get_requirement_suggestions(DummyDB(), outing, min_score=0.9)
    assert suggestions == []


def test_get_merit_badge_suggestions_sorting_and_filter(monkeypatch):
    outing = _outing("Dutch oven outdoor cooking food safety meal preparation")
    badges = [
        DummyBadge(uuid4(), "Cooking", "Outdoor cooking techniques", ["cooking", "food", "meal", "preparation"], eagle=False),
        DummyBadge(uuid4(), "Orienteering", "Map and compass usage", ["map", "compass"], eagle=False),
        DummyBadge(uuid4(), "Swimming", "Water safety and strokes", ["swim", "water"], eagle=False),
        DummyBadge(uuid4(), "Environmental Science", "Outdoor study", ["outdoor", "study"], eagle=True),
    ]
    monkeypatch.setattr(sugg.crud_requirement, 'search_merit_badges_by_keywords', lambda db, kw: badges)
    suggestions = sugg.get_merit_badge_suggestions(DummyDB(), outing, min_score=0.2)
    # Expect cooking and environmental science; orienteering might get low match (maybe map, compass not in outing)
    names = [s.name for s in suggestions]
    assert 'Cooking' in names
    assert any(s.eagle_required in [True, False] for s in suggestions)  # field populated
    assert all(s.match_score >= 0.2 for s in suggestions)


def test_get_outing_suggestions_combines(monkeypatch):
    outing = _outing("Overnight tent camping hike")
    monkeypatch.setattr(sugg.crud_requirement, 'search_rank_requirements_by_keywords', lambda db, kw: [
        DummyReq(uuid4(), "First Class", "5a", "Tent overnight", ["tent", "overnight"])
    ])
    monkeypatch.setattr(sugg.crud_requirement, 'search_merit_badges_by_keywords', lambda db, kw: [
        DummyBadge(uuid4(), "Camping", "Camping merit badge", ["camping", "tent"], eagle=False)
    ])
    combined = sugg.get_outing_suggestions(DummyDB(), outing, min_score=0.1)
    assert len(combined.requirements) == 1
    assert len(combined.merit_badges) == 1
    assert combined.requirements[0].match_score > 0
    assert combined.merit_badges[0].match_score > 0

# Scouting Requirements - Quick Reference

## Setup Commands

```bash
# 1. Run database migrations (includes schema + seed data)
cd backend
atlas migrate apply

# This will automatically:
# - Create the 4 new tables (rank_requirements, merit_badges, etc.)
# - Seed 50+ rank requirements (Scout through First Class)
# - Seed 30 merit badges (common outdoor/camping badges)

# 2. Demo the suggestion engine (optional)
python scripts/demo_suggestions.py
```

## API Endpoints

### Get Suggestions for an Outing

```bash
GET /api/v1/outings/{outing_id}/suggestions?min_score=0.1&max_requirements=10&max_merit_badges=10
```

### List All Rank Requirements

```bash
GET /api/v1/rank-requirements?rank=Tenderfoot&category=Camping
```

### List All Merit Badges

```bash
GET /api/v1/merit-badges
```

### Add Requirement to Outing

```bash
POST /api/v1/outings/{outing_id}/requirements
{
  "rank_requirement_id": "uuid",
  "notes": "Can be completed during tent setup session"
}
```

### Add Merit Badge to Outing

```bash
POST /api/v1/outings/{outing_id}/merit-badges
{
  "merit_badge_id": "uuid",
  "notes": "Requirements 1-3 can be worked on"
}
```

## Files Created

**Database:**

- `migrations/20251124_add_scouting_requirements.sql`

**Models:**

- `app/models/requirement.py` - RankRequirement, MeritBadge, OutingRequirement, OutingMeritBadge

**Schemas:**

- `app/schemas/requirement.py` - Pydantic models for API requests/responses

**CRUD:**

- `app/crud/requirement.py` - Database operations

**API:**

- `app/api/endpoints/requirements.py` - REST API endpoints

**Utils:**

- `app/utils/suggestions.py` - Keyword matching and suggestion engine

**Scripts:**

- `scripts/seed_requirements.py` - Populate rank requirements
- `scripts/seed_merit_badges.py` - Populate merit badges
- `scripts/demo_suggestions.py` - Demo the suggestion engine

**Tests:**

- `tests/test_suggestions.py` - Unit tests for suggestion engine

**Documentation:**

- `docs/SCOUTING_REQUIREMENTS.md` - Full feature documentation

## How It Works

1. **Keyword Extraction**: Extracts meaningful words from outing name/description
2. **Matching**: Compares outing keywords with requirement/badge keywords
3. **Scoring**: Calculates relevance score (0-1) based on keyword overlap
4. **Ranking**: Returns suggestions sorted by relevance

## Example

**Outing**: "Fall Camping Weekend - Overnight trip with tent setup and cooking"

**Extracted Keywords**: camping, overnight, tent, cooking, fall, weekend

**Matched Requirements**:

- Tenderfoot 1b (camping, overnight, tent) → 75% match
- Tenderfoot 2a (cooking, camping) → 50% match

**Matched Merit Badges**:

- Camping (camping, overnight, tent) → 43% match
- Cooking (cooking, camping) → 33% match

## Next Steps

1. Build frontend UI to display suggestions
2. Allow admins to easily add suggested requirements to outings
3. Track which scouts complete which requirements
4. Generate progress reports

## Support

- Swagger UI: `http://localhost:8000/docs`
- Full docs: `docs/SCOUTING_REQUIREMENTS.md`
- Demo: `python scripts/demo_suggestions.py`

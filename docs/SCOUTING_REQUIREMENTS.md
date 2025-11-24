# Scouting Requirements Feature

## Overview

The Scouting Requirements feature allows administrators to track Scout rank requirements (Scout, Tenderfoot, Second Class, First Class) and merit badges that can be completed during troop outings. The system includes intelligent keyword-based suggestions to help identify relevant requirements for each trip.

## Database Schema

### Tables Created

1. **rank_requirements** - Stores Scout rank requirements

   - `id` (UUID) - Primary key
   - `rank` (VARCHAR) - Scout rank level
   - `requirement_number` (VARCHAR) - Requirement identifier (e.g., "1a", "2b")
   - `requirement_text` (TEXT) - Full description
   - `keywords` (TEXT[]) - Array of keywords for matching
   - `category` (VARCHAR) - Category (e.g., "Camping", "First Aid")
   - `created_at`, `updated_at` (TIMESTAMP)

2. **merit_badges** - Stores merit badge information

   - `id` (UUID) - Primary key
   - `name` (VARCHAR) - Merit badge name (unique)
   - `description` (TEXT) - Brief description
   - `keywords` (TEXT[]) - Array of keywords for matching
   - `created_at`, `updated_at` (TIMESTAMP)

3. **outing_requirements** - Links outings to rank requirements

   - `id` (UUID) - Primary key
   - `outing_id` (UUID) - Foreign key to outings
   - `rank_requirement_id` (UUID) - Foreign key to rank_requirements
   - `notes` (TEXT) - Optional trip-specific notes
   - `created_at` (TIMESTAMP)

4. **outing_merit_badges** - Links outings to merit badges
   - `id` (UUID) - Primary key
   - `outing_id` (UUID) - Foreign key to outings
   - `merit_badge_id` (UUID) - Foreign key to merit_badges
   - `notes` (TEXT) - Optional notes about which requirements can be worked on
   - `created_at` (TIMESTAMP)

## API Endpoints

### Rank Requirements

- `GET /api/v1/rank-requirements` - List all rank requirements
  - Query params: `skip`, `limit`, `rank`, `category`
- `GET /api/v1/rank-requirements/{id}` - Get specific requirement
- `POST /api/v1/rank-requirements` - Create new requirement (admin only)
- `PUT /api/v1/rank-requirements/{id}` - Update requirement (admin only)
- `DELETE /api/v1/rank-requirements/{id}` - Delete requirement (admin only)

### Merit Badges

- `GET /api/v1/merit-badges` - List all merit badges
  - Query params: `skip`, `limit`
- `GET /api/v1/merit-badges/{id}` - Get specific merit badge
- `POST /api/v1/merit-badges` - Create new merit badge (admin only)
- `PUT /api/v1/merit-badges/{id}` - Update merit badge (admin only)
- `DELETE /api/v1/merit-badges/{id}` - Delete merit badge (admin only)

### Outing Requirements

- `GET /api/v1/outings/{outing_id}/requirements` - List requirements for an outing
- `POST /api/v1/outings/{outing_id}/requirements` - Add requirement to outing (admin only)
- `PUT /api/v1/outings/requirements/{id}` - Update outing requirement notes (admin only)
- `DELETE /api/v1/outings/requirements/{id}` - Remove requirement from outing (admin only)

### Outing Merit Badges

- `GET /api/v1/outings/{outing_id}/merit-badges` - List merit badges for an outing
- `POST /api/v1/outings/{outing_id}/merit-badges` - Add merit badge to outing (admin only)
- `PUT /api/v1/outings/merit-badges/{id}` - Update outing merit badge notes (admin only)
- `DELETE /api/v1/outings/merit-badges/{id}` - Remove merit badge from outing (admin only)

### Suggestions

- `GET /api/v1/outings/{outing_id}/suggestions` - Get suggested requirements and merit badges
  - Query params:
    - `min_score` (default: 0.1) - Minimum relevance score (0-1)
    - `max_requirements` (default: 10) - Max number of requirement suggestions
    - `max_merit_badges` (default: 10) - Max number of merit badge suggestions
  - Returns scored suggestions based on keyword matching

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
atlas migrate apply
```

This single command will:

- Create the 4 new tables (rank_requirements, merit_badges, outing_requirements, outing_merit_badges)
- Automatically seed 50+ rank requirements from Scout through First Class
- Automatically seed 30 common outdoor and camping-related merit badges

### 2. Verify Setup

Check that the data was seeded correctly:

```bash
# Connect to your database and verify
psql -d trailhead -c "SELECT rank, COUNT(*) FROM rank_requirements GROUP BY rank;"
psql -d trailhead -c "SELECT COUNT(*) FROM merit_badges;"
```

Expected output:

- Scout: 2 requirements
- Tenderfoot: 9 requirements
- Second Class: 11 requirements
- First Class: 16 requirements
- Merit Badges: 30 badges

## How It Works

### Keyword-Based Suggestions

The suggestion engine:

1. Extracts keywords from the outing's name and description
2. Removes common stop words
3. Searches for requirements/badges with matching keywords
4. Calculates relevance scores based on keyword overlap
5. Returns sorted suggestions with match details

Example:

- **Outing**: "Winter Camping at Big Bear"
- **Extracted keywords**: `["winter", "camping", "bear"]`
- **Matched Requirements**:
  - Tenderfoot 1b (camping, overnight, tent) - Score: 0.33
  - Second Class 3d (cooking, camping, food) - Score: 0.33
- **Matched Merit Badges**:
  - Camping (camping, outdoor, tent) - Score: 0.14
  - Snow Sports (snow, skiing, winter) - Score: 0.17

### Categories

Requirements are organized into categories:

- Camping
- Camping Skills
- Cooking
- First Aid
- Hiking
- Navigation
- Nature
- Outdoor Ethics
- Outdoor Skills

## Usage Example

### For Administrators

1. Create a new outing (e.g., "Weekend Backpacking Trip")
2. Call `/api/v1/outings/{id}/suggestions` to get relevant requirements
3. Review suggestions and add appropriate ones to the outing
4. Optionally add notes about how requirements can be fulfilled
5. Scouts can see which requirements they can work on during the trip

### For Participants

- View outing details to see which rank requirements can be completed
- See which merit badges can be worked on during the trip
- Plan accordingly and bring necessary materials

## Files Modified/Created

### New Migrations

- `backend/migrations/20251124_add_scouting_requirements.sql` - Schema creation
- `backend/migrations/20251124_seed_rank_requirements.sql` - Seed rank requirements data
- `backend/migrations/20251124_seed_merit_badges.sql` - Seed merit badges data

### New Backend Files

- `backend/app/models/requirement.py` - SQLAlchemy models
- `backend/app/schemas/requirement.py` - Pydantic schemas
- `backend/app/crud/requirement.py` - CRUD operations
- `backend/app/api/endpoints/requirements.py` - API endpoints
- `backend/app/utils/suggestions.py` - Suggestion engine

### Scripts (Optional - for standalone use)

- `backend/scripts/seed_requirements.py` - Python seed script (optional)
- `backend/scripts/seed_merit_badges.py` - Python seed script (optional)
- `backend/scripts/demo_suggestions.py` - Demo the suggestion engine

### Modified Files

- `backend/app/models/__init__.py` - Added new model imports
- `backend/app/models/outing.py` - Added relationships to requirements/badges
- `backend/app/main.py` - Registered requirements router

## Future Enhancements

Potential improvements for future iterations:

1. **Individual Progress Tracking**

   - Track which scouts have completed which requirements
   - Mark requirements as "in progress" or "completed"
   - Generate progress reports for each scout

2. **Requirement Details**

   - Store full requirement details and verification steps
   - Add resources and tips for completing requirements
   - Link to official BSA/Scouting America resources

3. **Smart Planning**

   - Suggest outings based on requirements scouts need
   - Optimize trip planning to cover multiple requirements
   - Track which requirements are most commonly needed

4. **Merit Badge Requirements**

   - Break down merit badges into individual requirements
   - Track progress on specific merit badge requirements
   - Identify which requirements can be partially completed

5. **Reporting**
   - Generate advancement reports for scoutmasters
   - Export requirement completion data
   - Visualize scout progression through ranks

## Testing

To test the feature:

1. Start the backend server: `cd backend && uvicorn app.main:main --reload`
2. Visit Swagger UI: `http://localhost:8000/docs`
3. Test the endpoints:
   - List all rank requirements
   - Create an outing with keywords like "camping", "hiking", "cooking"
   - Call the suggestions endpoint for that outing
   - Add suggested requirements to the outing

## Support

For issues or questions about this feature, please refer to:

- API documentation at `/docs`
- Main project README at `/README.md`
- Project documentation in `/docs`

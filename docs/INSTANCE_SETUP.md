# Instance Setup Feature

## Overview

The Instance Setup feature allows users to create a new Trailhead instance with a custom organization name, multiple linked troops, and patrol configurations. This replaces the previous approach where users would add troops one at a time.

## Features

### 1. Organization/Instance Concept

Each Trailhead deployment can now support multiple organizations. An organization groups one or more troops together under a common name (e.g., "Troop 123", "Ivy Scouts", "District 5").

**Benefits:**

- Clear organizational structure
- Multi-troop support from the start
- Ability to manage multiple distinct scouting groups in one deployment

### 2. Multi-Step Setup Wizard

The instance setup wizard guides users through:

#### Step 1: Organization Information

- **Organization Name** (required): Name of the group (e.g., "Troop 123" or "Ivy Scouts")
- **Description** (optional): Brief description of the organization

#### Step 2: Troop Setup

- Add one or more troops with full configuration:
  - Troop Number (required)
  - Charter Organization
  - Meeting Location
  - Meeting Day
  - Notes
- **Patrol Setup**: For each troop, add one or more patrols with names

#### Step 3: Roster Import

- Import CSV rosters from my.scouting.org for each troop
- Optional - can be skipped and members added manually later
- One roster file per troop

#### Step 4: Complete

- Marks organization setup as complete
- Redirects to family setup page

## Database Schema

### Organizations Table

```sql
CREATE TABLE "public"."organizations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(255) NOT NULL,
  "description" text NULL,
  "is_setup_complete" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

### Foreign Key Relationships

- `troops.organization_id` → `organizations.id` (CASCADE on delete)
- `users.organization_id` → `organizations.id` (SET NULL on delete)

## API Endpoints

### Organizations

- `GET /api/organizations` - List all organizations
- `POST /api/organizations` - Create a new organization
- `GET /api/organizations/{id}` - Get organization by ID
- `PUT /api/organizations/{id}` - Update organization
- `POST /api/organizations/{id}/complete-setup` - Mark setup complete
- `DELETE /api/organizations/{id}` - Delete organization (admin only)

### Troops (Updated)

- `POST /api/troops` - Now accepts optional `organization_id` field

## User Flow

### For New Installations

1. User signs in for the first time
2. Redirected to `/instance-setup`
3. Completes organization info (Step 1)
4. Adds troops and patrols (Step 2)
5. Optionally imports rosters (Step 3)
6. Completes setup (Step 4)
7. Redirected to family setup page
8. Can then browse and manage outings

### Accessing the Wizard

- Navigate to `/instance-setup` route
- Protected by authentication (requires login)
- Can be accessed anytime to create additional organizations

## Frontend Components

### `InstanceSetupWizard.tsx`

Located: `/frontend/src/components/InstanceSetupWizard.tsx`

**Key Features:**

- Multi-step form with progress indicator
- Dynamic troop/patrol management
- CSV file upload per troop
- Error handling and validation
- Uses Tailwind + CSS variables for styling

## Backend Implementation

### Models

- `Organization` (`app/models/organization.py`)
- Updated `Troop` with `organization_id` foreign key
- Updated `User` with `organization_id` foreign key

### CRUD Operations

- `app/crud/organization.py` - Full CRUD for organizations

### Schemas

- `OrganizationCreate`
- `OrganizationUpdate`
- `OrganizationResponse`
- `OrganizationListResponse`

### API Endpoints

- `app/api/endpoints/organizations.py`

## Migration

**File:** `backend/migrations/20251204000001_add_organizations.sql`

**What it does:**

1. Creates `organizations` table
2. Adds `organization_id` column to `troops`
3. Adds `organization_id` column to `users`
4. Creates necessary foreign keys and indexes

**Running the migration:**

```bash
cd backend
atlas migrate apply --dir file://migrations --url docker://postgres/15/dev
```

## Styling Guidelines

All components follow project styling standards:

- ✅ Tailwind utility classes for layout
- ✅ CSS variables for all colors
- ✅ Semantic HTML
- ✅ Responsive design with breakpoints
- ✅ Proper focus/hover states

## Future Enhancements

- [ ] Organization-level settings (e.g., default timezone, branding)
- [ ] Organization admin roles
- [ ] Organization switching for users belonging to multiple orgs
- [ ] Organization-level reporting and analytics
- [ ] Ability to edit/reorganize troops after initial setup
- [ ] Bulk operations for patrols
- [ ] Import validation and error reporting for roster CSVs

## Testing

To test the instance setup:

1. Start the backend and frontend
2. Sign in as a new user
3. Navigate to `/instance-setup`
4. Follow the wizard steps:
   - Enter org name (e.g., "Test Troop 123")
   - Add a troop with number "123"
   - Add patrols like "Eagle Patrol", "Wolf Patrol"
   - Skip roster import or test with a sample CSV
   - Complete setup
5. Verify organization and troops are created in database
6. Verify user is assigned to the organization

## Database Queries for Verification

```sql
-- Check organizations
SELECT * FROM organizations;

-- Check troops with organization
SELECT t.*, o.name as org_name
FROM troops t
LEFT JOIN organizations o ON t.organization_id = o.id;

-- Check users with organization
SELECT u.email, u.full_name, o.name as org_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id;
```

## Troubleshooting

### Organization not created

- Check browser console for errors
- Verify authentication token is valid
- Check backend logs for API errors

### Troops not linking to organization

- Verify `organization_id` is being passed in TroopCreate
- Check frontend API call includes the field
- Verify migration was applied

### Roster import fails

- Ensure CSV format matches my.scouting.org export
- Check file size limits
- Verify roster import endpoint is accessible

## Related Documentation

- [Initial Sign-In Wizard](./INITIAL_SIGNIN_WIZARD.md)
- [Troop Management](./SCOUTING_REQUIREMENTS.md)
- [Database Workflow](./DATABASE_WORKFLOW.md)
- [Authentication Setup](./AUTHENTICATION_SETUP.md)

# Family Management System Implementation

## Overview
This document describes the implementation of the family management system that allows parents to manage their family members (parents and scouts) with saved information that can be reused when signing up for outings.

## Completed Implementation

### 1. Backend Database Models (`backend/app/models/family.py`)
Created three new models:
- **FamilyMember**: Stores reusable family member data
  - Basic info: name, member_type (parent/scout), date_of_birth
  - Scout-specific: troop_number, patrol_name
  - Parent-specific: has_youth_protection, vehicle_capacity
  - Medical: medical_notes
  - Relationships to dietary preferences and allergies

- **FamilyMemberDietaryPreference**: Stores dietary preferences per family member
  - Links to FamilyMember
  - Stores preference string (vegetarian, vegan, gluten-free, etc.)

- **FamilyMemberAllergy**: Stores allergies per family member
  - Links to FamilyMember
  - Stores allergy type and severity

### 2. Database Migration (`backend/migrations/f8a9b3c5d6e7_add_family_management_tables.py`)
- Creates family_members table
- Creates family_member_dietary_preferences table
- Creates family_member_allergies table
- Includes proper foreign keys and indexes

### 3. Backend API Schemas (`backend/app/schemas/family.py`)
Created Pydantic schemas for validation:
- FamilyMemberCreate: For creating new family members
- FamilyMemberUpdate: For updating existing family members
- FamilyMemberResponse: For returning family member data
- FamilyMemberSummary: Simplified view for outing signup selection
- DietaryPreferenceResponse, AllergyResponse: For nested data

### 4. Backend API Endpoints (`backend/app/api/endpoints/family.py`)
Implemented full CRUD operations:
- `GET /api/family/`: List all family members for current user
- `GET /api/family/summary`: Get simplified list for signup selection
- `GET /api/family/{member_id}`: Get specific family member
- `POST /api/family/`: Create new family member
- `PUT /api/family/{member_id}`: Update family member
- `DELETE /api/family/{member_id}`: Delete family member

All endpoints require authentication and only allow users to manage their own family members.

### 5. Frontend Types (`frontend/src/types/index.ts`)
Added TypeScript interfaces:
- FamilyMember, FamilyMemberCreate, FamilyMemberUpdate
- FamilyMemberSummary, FamilyMemberListResponse
- DietaryPreference, FamilyMemberAllergy
- ParentRegistrationRequest, RegistrationResponse

### 6. Frontend API Service (`frontend/src/services/api.ts`)
Added familyAPI with methods:
- getAll(): Fetch all family members
- getSummary(): Get simplified list for selection
- getById(id): Get specific member
- create(member): Create new member
- update(id, member): Update member
- delete(id): Delete member

### 7. Family Management UI (`frontend/src/components/Parent/FamilyManagement.tsx`)
Created comprehensive React component with:
- List view of all family members
- Add/Edit/Delete functionality
- Form for creating/editing members with:
  - Basic information (name, type, DOB)
  - Scout-specific fields (troop, patrol)
  - Parent-specific fields (youth protection, vehicle capacity)
  - Medical notes
  - Dietary preferences (add/remove)
  - Allergies with severity (add/remove)
- Responsive card-based layout
- Modal form for adding/editing

### 8. Parent Page (`frontend/src/pages/ParentPage.tsx`)
Created parent dashboard with:
- Tab navigation (Available Outings / My Family)
- Integration of FamilyManagement component
- Outing list display
- Helpful tips for users

## Integration Points

### Authentication Flow
1. Parents register via Clerk OAuth
2. After registration, they're assigned the "parent" role
3. They can log in via Clerk OAuth flow
4. Access token is used for all family management operations

### 9. Outing Signup Integration (`frontend/src/components/Participant/SignupForm.tsx`) ✅ COMPLETED
Enhanced the SignupForm component with full family management integration:

1. **Authentication Detection** ✅
   - Uses `useAuth()` hook to detect authenticated parents
   - Automatically loads family members for authenticated parents
   - Pre-fills contact email from user profile

2. **Family Member Selection UI** ✅
   - Displays saved family members as selectable cards before participant form
   - Shows member name, type, age, and troop number
   - Allows selection of existing family member or adding new participant
   - "Back to Family Selection" button to return to selection screen

3. **Pre-filling from Family Members** ✅
   - Fetches full family member details when selected
   - Automatically calculates age from date of birth
   - Pre-fills all participant form fields:
     - Name, type, age, troop, patrol
     - Youth protection status, vehicle capacity
     - Dietary preferences and restrictions
     - Allergies with severity levels
   - Allows editing of pre-filled data if needed

4. **Save to Family Option** ✅
   - Checkbox: "💾 Save these participants to my family for future outings"
   - Only shown for authenticated parents adding new participants
   - Automatically saves all participants to family after successful signup
   - Includes helpful description of the feature
   - Reloads family member list after saving

5. **User Experience Enhancements** ✅
   - Seamless flow between family selection and manual entry
   - Visual distinction with green-bordered family selection section
   - Clear state management for selection vs. manual entry modes
   - Proper cleanup and reset after successful signup

## Database Schema

```
users
├── id (UUID, PK)
├── email
├── full_name
├── role (admin/parent/user)
└── ...

family_members
├── id (UUID, PK)
├── user_id (UUID, FK -> users.id)
├── name
├── member_type (parent/scout)
├── date_of_birth
├── troop_number
├── patrol_name
├── has_youth_protection
├── vehicle_capacity
├── medical_notes
├── created_at
└── updated_at

family_member_dietary_preferences
├── id (UUID, PK)
├── family_member_id (UUID, FK -> family_members.id)
└── preference

family_member_allergies
├── id (UUID, PK)
├── family_member_id (UUID, FK -> family_members.id)
├── allergy
└── severity
```

## API Endpoints

### Authentication
- Clerk OAuth handles authentication
- `/api/clerk/me` - Get current user info
- `/api/clerk/sync-role` - Sync role from Clerk metadata

### Family Management
- `GET /api/family/` - List all family members
- `GET /api/family/summary` - Get simplified list
- `GET /api/family/{id}` - Get specific member
- `POST /api/family/` - Create member
- `PUT /api/family/{id}` - Update member
- `DELETE /api/family/{id}` - Delete member

### Outings & Signups (existing)
- `GET /api/outings/available` - List available outings
- `POST /api/signups` - Create signup

## Next Steps

### 1. Run Database Migration
Execute the migration to create the new tables:
```bash
cd backend
python3 -m atlas migrate apply --env sqlalchemy
```

### 2. Testing
Test the complete flow:
1. Register as a parent via Clerk
2. Log in via Clerk OAuth
3. Add family members
4. Sign up for a outing using saved family members
5. Verify data is correctly saved and retrieved

## Benefits

1. **Time Savings**: Parents don't re-enter information for each outing
2. **Data Consistency**: Same information used across all outings
3. **Easy Updates**: Update family member info in one place
4. **Better UX**: Streamlined signup process
5. **Data Quality**: Reduced errors from manual entry

## Security Considerations

- All family management endpoints require authentication
- Users can only access their own family members
- Clerk handles authentication and user management
- JWT tokens used for API authorization
- Cascade deletes ensure data integrity
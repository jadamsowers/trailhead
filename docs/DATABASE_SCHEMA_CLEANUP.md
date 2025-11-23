# Database Schema Cleanup Plan

## Overview
This document outlines the cleanup plan for the Trailhead database schema, addressing migration file proliferation and schema inconsistencies.

## Current Issues

### 1. Migration File Proliferation
**Problem**: 38 migration files exist, with:
- 26+ files named "initial_migration.py" (redundant)
- 2 merge migration files (5efb3c7cba55, 29b51c0fcf54, 9047407fe76b)
- Multiple heads that had to be merged

**Impact**: 
- Difficult to understand schema evolution
- Slower migration execution
- Increased maintenance burden
- Confusion for new developers

### 2. Redundant Fields in Participant Model
**Problem**: The [`Participant`](backend/app/models/participant.py:10) model has redundant fields:
- `participant_type` (line 18): stores 'scout' or 'adult'
- `is_adult` (line 19): boolean flag for the same information

**Impact**:
- Data redundancy
- Potential for inconsistency
- Extra storage overhead

### 3. Inconsistent Naming Conventions
**Problem**: Inconsistent terminology across models:
- [`DietaryRestriction`](backend/app/models/participant.py:44) uses `restriction_type`
- [`FamilyMemberDietaryPreference`](backend/app/models/family.py:47) uses `preference`
- Both represent the same concept but with different names

**Impact**:
- Confusion in codebase
- Harder to maintain
- Inconsistent API responses

### 4. Missing Gender Field in FamilyMember
**Problem**: [`FamilyMember`](backend/app/models/family.py:10) model lacks a gender field, but [`Participant`](backend/app/models/participant.py:10) has one (line 20).

**Impact**:
- Cannot pre-populate gender when creating participants from family members
- Inconsistent data model between family management and signup flows

### 5. Duplicate Dietary/Allergy Tables
**Problem**: Two sets of tables for the same purpose:
- [`DietaryRestriction`](backend/app/models/participant.py:44) & [`Allergy`](backend/app/models/participant.py:59) for participants
- [`FamilyMemberDietaryPreference`](backend/app/models/family.py:47) & [`FamilyMemberAllergy`](backend/app/models/family.py:62) for family members

**Impact**:
- Code duplication
- Inconsistent field names (restriction_type vs preference)
- Different severity tracking (only in FamilyMemberAllergy)

## Recommended Cleanup Actions

### Phase 1: Migration Consolidation (Recommended for Fresh Deployments)
**Action**: Create a single consolidated migration that represents the current schema state.

**Steps**:
1. Backup all migration files
2. Create new consolidated migration with current schema
3. Archive old migrations
4. Update alembic version table

**Benefits**:
- Clean migration history
- Faster migration execution
- Easier to understand schema

**Risk**: Only suitable for development or if you can recreate production database

### Phase 2: Schema Improvements (Safe for Production)

#### 2.1 Remove Redundant `participant_type` Field
**Action**: Keep `is_adult` boolean, remove `participant_type` string field.

**Migration**:
```python
# Remove participant_type column from participants table
op.drop_column('participants', 'participant_type')
```

**Code Changes**:
- Update [`Participant`](backend/app/models/participant.py:10) model
- Update all queries using `participant_type`
- Update [`Signup`](backend/app/models/signup.py:10) properties (lines 34-41)

#### 2.2 Add Gender to FamilyMember
**Action**: Add gender field to [`FamilyMember`](backend/app/models/family.py:10) model.

**Migration**:
```python
# Add gender column to family_members table
op.add_column('family_members', sa.Column('gender', sa.String(20), nullable=True))
# Create index
op.create_index('ix_family_members_gender', 'family_members', ['gender'])
```

**Benefits**:
- Consistent data model
- Better pre-population of signup forms
- Supports two-deep leadership calculations

#### 2.3 Standardize Dietary/Allergy Field Names
**Action**: Rename fields for consistency.

**Changes**:
- Rename `restriction_type` → `dietary_type` in [`DietaryRestriction`](backend/app/models/participant.py:44)
- Rename `preference` → `dietary_type` in [`FamilyMemberDietaryPreference`](backend/app/models/family.py:47)
- Add `severity` field to [`Allergy`](backend/app/models/participant.py:59) model

**Migration**:
```python
# Rename columns
op.alter_column('dietary_restrictions', 'restriction_type', new_column_name='dietary_type')
op.alter_column('family_member_dietary_preferences', 'preference', new_column_name='dietary_type')
# Add severity to allergies
op.add_column('allergies', sa.Column('severity', sa.String(50), nullable=True))
```

### Phase 3: Index Optimization

#### 3.1 Review and Optimize Indexes
**Current Indexes** (from models):
- Users: id, email, role
- Outings: id, outing_date, end_date
- Signups: id, outing_id
- Participants: id, signup_id, participant_type, gender, troop_number
- FamilyMembers: id, user_id, member_type, troop_number
- RefreshTokens: id, user_id, token

**Recommendations**:
- Add composite index on [`Outing`](backend/app/models/outing.py:10) (outing_date, end_date) for date range queries
- Add composite index on [`Participant`](backend/app/models/participant.py:10) (signup_id, is_adult) for adult counting
- Consider removing `participant_type` index after field removal

## Implementation Priority

### High Priority (Do First)
1. ✅ Document current schema state (this document)
2. Add gender field to FamilyMember
3. Remove redundant participant_type field

### Medium Priority
4. Standardize dietary/allergy field names
5. Add severity to Allergy model
6. Optimize indexes

### Low Priority (Optional)
7. Consolidate migrations (only if starting fresh or can recreate DB)

## Migration Strategy

### For Production Systems
**Recommended Approach**: Incremental migrations (Phase 2 & 3 only)
- Each change in a separate migration
- Backward compatible where possible
- Test thoroughly in staging

### For Development/New Deployments
**Recommended Approach**: Full consolidation (Phase 1, 2, & 3)
- Single consolidated migration
- Clean slate
- Faster setup for new developers

## Testing Checklist

Before applying any migration:
- [ ] Backup production database
- [ ] Test migration on copy of production data
- [ ] Verify all API endpoints still work
- [ ] Check all CRUD operations
- [ ] Verify signup flow works end-to-end
- [ ] Test family management features
- [ ] Run full test suite
- [ ] Verify data integrity

## Rollback Plan

For each migration:
1. Create downgrade function
2. Test rollback on staging
3. Document rollback procedure
4. Keep backup for 30 days

## Estimated Impact

### Development Time
- Phase 1 (consolidation): 4-6 hours
- Phase 2 (schema improvements): 6-8 hours
- Phase 3 (index optimization): 2-3 hours
- Testing: 4-6 hours
- **Total**: 16-23 hours

### Downtime
- Phase 2 migrations: < 1 minute each (with proper indexes)
- Phase 3 migrations: < 30 seconds each
- **Total**: < 5 minutes (can be done during maintenance window)

## Next Steps

1. Review this plan with team
2. Decide on approach (incremental vs consolidation)
3. Create feature branch for schema cleanup
4. Implement Phase 2 changes first (safest)
5. Test thoroughly
6. Deploy to staging
7. Monitor for issues
8. Deploy to production during maintenance window

## References

- Current Models: [`backend/app/models/`](backend/app/models/)
- Migration Files: [`backend/alembic/versions/`](backend/alembic/versions/)
- Alembic Documentation: https://alembic.sqlalchemy.org/
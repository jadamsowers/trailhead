# Family Member Ordering Implementation

## Overview
When adding family members to a outing, adults are now processed before scouts to ensure their vehicle capacity is added to the outing count before scouts are added.

## Changes Made

### Frontend Changes (`frontend/src/components/Participant/SignupForm.tsx`)

Modified the `handleConfirmSelection` function (line 182) to:

1. **Load all family members in parallel** using `Promise.all()` instead of sequential loading
2. **Sort family members** so adults (member_type === 'parent') come before scouts (member_type === 'scout')
3. **Process sorted members** to create the participants array in the correct order

```typescript
// Load all family members first
const memberDetails = await Promise.all(
    selectedFamilyMemberIds.map(memberId => familyAPI.getById(memberId))
);

// Sort members: adults first, then scouts
// This ensures adults' vehicle capacity is added to the outing before scouts
const sortedMembers = memberDetails.sort((a, b) => {
    if (a.member_type === 'parent' && b.member_type === 'scout') return -1;
    if (a.member_type === 'scout' && b.member_type === 'parent') return 1;
    return 0;
});
```

### Backend Verification

The backend already processes participants in the order they're received:

1. **Sequential Processing**: The `create_signup` function in `backend/app/crud/signup.py` iterates through participants in order
2. **Capacity Calculation**: The `total_vehicle_capacity` property in `backend/app/models/outing.py` sums vehicle capacity from all adult participants
3. **Validation**: The signup endpoint validates capacity by accounting for new vehicle capacity being added

## Why This Matters

For outings with vehicle-based capacity:
- Adults can provide vehicle capacity (number of seats they can transport)
- Scouts consume capacity but don't provide it
- By processing adults first, their vehicle capacity is accounted for before checking if there's room for scouts
- This prevents false "outing is full" errors when an adult with vehicle capacity and scouts are signing up together

## Example Scenario

**Before**: Signing up 1 adult (with 5 vehicle seats) + 3 scouts
- If scouts processed first: Outing might reject signup thinking there's no capacity
- Then adult's 5 seats would be added (but too late)

**After**: Same signup with adults processed first
- Adult's 5 vehicle seats are added to outing capacity
- Then 3 scouts are added (consuming 3 of those 5 seats)
- Signup succeeds correctly

## Testing

To test this implementation:

1. Create a outing with vehicle-based capacity
2. Add a family with at least one adult (with vehicle capacity) and one scout
3. Select both the adult and scout when signing up for the outing
4. Verify the signup succeeds and the adult's vehicle capacity is properly accounted for

The sorting happens automatically in the frontend, ensuring the correct order is sent to the backend API.
# Check-in Mode Implementation Plan

## Overview
Create a mobile-friendly check-in interface that allows outing leaders to check in participants before departure. The system should work offline and track who checked in for camping night credit.

## Requirements
- [ ] Mobile-friendly interface
- [ ] Offline mode with cached participant list
- [ ] Track who checked in (timestamp + checker identity)
- [ ] Export check-in data for camping night tracking
- [ ] Only accessible to outing leaders/admins

## Architecture

### Frontend Components

#### 1. CheckInPage Component (`/check-in/:outingId`)
- Main page for check-in interface
- Displays outing details
- Shows list of all signed-up participants
- Checkbox/toggle for each participant
- Search/filter functionality
- Summary stats (checked in / total)

#### 2. CheckInList Component
- Displays participant list with check-in status
- Grouping options (by family, by patrol, by type)
- Visual indicators for checked-in status
- Quick actions (check in all, uncheck all)

#### 3. OfflineSync Component
- Handles offline data caching
- Syncs check-in data when online
- Shows sync status indicator

### Backend API Endpoints

#### 1. GET `/api/outings/:outingId/checkin`
- Returns participant list for check-in
- Includes existing check-in status
- Requires auth (leader/admin only)

#### 2. POST `/api/outings/:outingId/checkin`
- Records check-in for participants
- Body: `{ participant_ids: string[], checked_in_by: string, timestamp: string }`
- Returns updated check-in status

#### 3. GET `/api/outings/:outingId/checkin/export`
- Exports check-in data (CSV/PDF)
- Includes participant details + check-in timestamp
- For camping night tracking

### Database Schema

#### New Table: `checkins`
```sql
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    signup_id UUID NOT NULL REFERENCES signups(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL,  -- from signup participants
    checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
    checked_in_by VARCHAR(255) NOT NULL,  -- user who performed check-in
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(outing_id, participant_id)
);

CREATE INDEX idx_checkins_outing ON checkins(outing_id);
CREATE INDEX idx_checkins_signup ON checkins(signup_id);
```

### Data Types

#### TypeScript Interfaces
```typescript
export interface CheckInRecord {
    id: string;
    outing_id: string;
    signup_id: string;
    participant_id: string;
    participant_name: string;
    checked_in_at: string;
    checked_in_by: string;
}

export interface CheckInParticipant {
    id: string;
    signup_id: string;
    name: string;
    member_type: 'scout' | 'adult';
    family_name: string;
    patrol_name?: string;
    is_checked_in: boolean;
    checked_in_at?: string;
    checked_in_by?: string;
}

export interface CheckInSummary {
    outing_id: string;
    outing_name: string;
    total_participants: number;
    checked_in_count: number;
    participants: CheckInParticipant[];
}
```

## Implementation Steps

### Phase 1: Backend API
1. [ ] Create database migration for `checkins` table
2. [ ] Create CheckIn model in backend
3. [ ] Implement GET `/api/outings/:outingId/checkin` endpoint
4. [ ] Implement POST `/api/outings/:outingId/checkin` endpoint
5. [ ] Implement GET `/api/outings/:outingId/checkin/export` endpoint
6. [ ] Add authorization checks (leader/admin only)
7. [ ] Write backend tests

### Phase 2: Frontend Core
1. [ ] Add CheckIn types to `types/index.ts`
2. [ ] Create `checkInAPI` in `services/api.ts`
3. [ ] Create `CheckInPage` component
4. [ ] Create `CheckInList` component
5. [ ] Add routing for `/check-in/:outingId`
6. [ ] Implement basic check-in functionality

### Phase 3: Offline Support
1. [ ] Implement IndexedDB for offline storage
2. [ ] Create offline sync service
3. [ ] Add service worker for offline capability
4. [ ] Implement background sync
5. [ ] Add sync status indicators

### Phase 4: Mobile Optimization
1. [ ] Optimize layout for mobile screens
2. [ ] Add touch-friendly controls
3. [ ] Implement swipe gestures for check-in
4. [ ] Add haptic feedback (if supported)
5. [ ] Test on various mobile devices

### Phase 5: Export & Reporting
1. [ ] Implement CSV export
2. [ ] Implement PDF export with camping night details
3. [ ] Add email functionality for reports
4. [ ] Create summary dashboard

## User Flow

1. **Leader accesses check-in mode**
   - Navigate to outing details
   - Click "Check-in Mode" button
   - System loads participant list

2. **Offline caching**
   - Participant list cached in IndexedDB
   - Works without internet connection
   - Check-ins stored locally

3. **Check-in process**
   - Leader sees list of all participants
   - Tap/click to check in each participant
   - Visual confirmation of check-in
   - Summary updates in real-time

4. **Sync when online**
   - Background sync when connection restored
   - Conflict resolution if needed
   - Success notification

5. **Export data**
   - Leader exports check-in report
   - CSV or PDF format
   - Includes all required camping night data

## Security Considerations

- [ ] Only authenticated users can access check-in
- [ ] Only outing leaders/admins can perform check-ins
- [ ] Validate outing_id and participant_ids
- [ ] Prevent duplicate check-ins
- [ ] Audit trail for all check-in actions

## Testing Strategy

- [ ] Unit tests for API endpoints
- [ ] Integration tests for check-in flow
- [ ] Offline functionality tests
- [ ] Mobile responsiveness tests
- [ ] Performance tests with large participant lists
- [ ] Security/authorization tests

## Future Enhancements

- [ ] QR code scanning for quick check-in
- [ ] Bulk check-in by patrol/family
- [ ] Check-out functionality
- [ ] Real-time sync across multiple devices
- [ ] Push notifications for check-in status
- [ ] Integration with camping night tracking system

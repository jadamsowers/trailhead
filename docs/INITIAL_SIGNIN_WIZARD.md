# Initial Sign-In Wizard Implementation

## Overview
Implemented a multi-step wizard for first-time user sign-ins that collects essential information and guides users through the setup process.

## Features Implemented

### 1. Multi-Step Wizard Component (`InitialSignInWizard.tsx`)

#### Step 1: User Contact Information (All Users)
- **Phone Number** (required)
- **Emergency Contact Name** (required)
- **Emergency Contact Phone** (required)
- **Youth Protection Training Date** (optional)
  - If omitted, displays warning about YPT requirement for outings
  - Links to my.scouting.org for completing training

#### Step 2: Troop Configuration (Admins Only)
- Allows admins to create one or more troops
- Each troop can have:
  - Troop Number (required)
  - Charter Organization
  - Meeting Location
  - Meeting Day
  - Notes
- Dynamic form: can add/remove troops
- Uses existing `/troops` API endpoint

#### Step 3: Redirect to Family Setup
- After completing the wizard, users are redirected to `/family-setup`
- This allows them to add family members before signing up for outings

### 2. Backend Integration

#### Existing Endpoints Used
- `PATCH /auth/me/contact` - Updates user contact information
  - Saves phone, emergency_contact_name, emergency_contact_phone, youth_protection_expiration
- `POST /troops` - Creates troops (admin only)
- `GET /auth/me` - Retrieves user profile to check if setup is complete

#### Database Fields Used
The `users` table already had all necessary fields:
- `phone`
- `emergency_contact_name`
- `emergency_contact_phone`
- `youth_protection_expiration`

### 3. Initial Setup Guard (`InitialSetupGuard.tsx`)
- Checks if user has completed initial setup
- Redirects to `/initial-setup` if phone or emergency contact is missing
- Excludes certain routes from the check (/, /login, /sign-up, /admin-setup, /initial-setup)
- Wraps protected routes to ensure users complete setup before accessing features

### 4. Routing Updates (`App.tsx`)
- Added `/initial-setup` route
- Changed `afterSignUpUrl` from `/family-setup` to `/initial-setup`
- Wrapped protected routes with `InitialSetupGuard`:
  - `/family-setup`
  - `/profile`
  - `/outings`
  - `/check-in/:outingId`

## User Flow

### For Regular Parents/Adults:
1. User signs up via Clerk
2. Redirected to `/initial-setup`
3. Fills out contact information and optional YPT date
4. Clicks "Continue"
5. Redirected to `/family-setup` to add family members
6. Can then browse and sign up for outings

### For Admins:
1. User signs up via Clerk (with admin role in metadata)
2. Redirected to `/initial-setup`
3. Fills out contact information and optional YPT date
4. Clicks "Next: Configure Troops"
5. Fills out troop information (can add multiple troops)
6. Clicks "Continue to Family Setup"
7. Redirected to `/family-setup` to add family members
8. Can then access admin panel and manage outings

## Styling
- Uses Tailwind utility classes for layout and spacing
- Uses CSS variables for all colors (following project guidelines)
- Responsive design with proper breakpoints
- Semantic HTML elements
- Hover and focus states on interactive elements

## Future Enhancements
- Add patrol creation in the admin step (currently only creates troops)
- Add validation for phone number formats
- Add progress indicator showing which step user is on
- Store wizard completion flag in user metadata to avoid re-checking on every page load
- Add ability to skip and complete later (with persistent reminders)

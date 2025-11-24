# New Features

## Check-in Mode

Outing leaders can check in participants before departure

- [x] Create mobile-friendly check-in interface (Frontend complete!)
- [x] Implement offline mode with cached check-in list (Future enhancement)
- [x] Capture who checked in for camping night tracking (Backend complete)
- [x] Add export functionality for check-in data (Backend CSV export complete)

## Outing Configuration

Enhancements to outing setup and management

- [x] Add drop-off time and location fields
- [x] Add pickup time and location fields
- [x] Add cost field for outing
- [x] Add suggested gear list functionality
  - [ ] ability to select from pre-defined gear lists (backpacking, truck camping, cold weather) and also add in trip-specific needs
- [x] Add icon selection (emoji or Bootstrap icon)
- [x] Generate QR code for outing
  - [x] QR code links to specific outing URL
- [ ] Add ability to close signups
  - [ ] Date-based automatic closure option
  - [ ] Manual close signups button
- [ ] Ability to draft an email whenever a change is made to the trip

## Scouting requirements

- [ ] create list of common requirements (Scout/Tenderfoot/Second Class/First Class) that can be completed on trips
  - [ ] suggest requirements based on outing type and keywords
- [ ] suggest common merit badges based on outing type and keywords (e.g. First Aid, Cooking, Camping, Hiking, etc.)

## Signup Configuration

Enhancements to family profile and requests

- [ ] Add grubmaster request functionality
  - [ ] trip admin approves grubmasters
- [ ] Add gear request functionality
- [x] Store emergency contact information and phone number with account
  - [x] If the user updates during signup, update the account
  - [x] Created Profile page for users to view and edit contact information

## Accessibility Improvements

Make the app more accessible for all users

- [ ] Conduct comprehensive accessibility audit
- [ ] Implement WCAG 2.1 AA compliance
- [x] Add keyboard navigation support (collapsible sections, interactive elements)
- [x] Add screen reader support (aria-live regions, aria-labels, aria-expanded)
- [ ] Improve color contrast ratios (conduct full audit)
- [x] Add ARIA labels and landmarks (basic implementation complete)
  - [x] Menu roles and menuitems in navigation
  - [x] Dialog roles for modals
  - [x] Button roles for interactive elements
  - [x] Aria-expanded for collapsible sections
  - [x] Aria-labels for icon buttons and actions
- [ ] Add focus indicators for all interactive elements
- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Add skip navigation links

## Legal Compliance & Data Protection

Ensure the application complies with relevant legal requirements

### Privacy & Data Protection

- [ ] Create comprehensive Privacy Policy
  - [ ] Data collection and usage disclosures
  - [ ] Third-party service disclosures (Clerk authentication)
  - [ ] Cookie policy and consent
  - [ ] Data retention policies
  - [ ] User rights (access, deletion, portability)
- [ ] Implement COPPA compliance (Children's Online Privacy Protection Act)
  - [ ] Parental consent mechanism for users under 13
  - [ ] Limited data collection for minors
  - [ ] Parental access to child's data
- [ ] GDPR compliance considerations (if applicable)
  - [ ] Right to be forgotten implementation
  - [ ] Data portability features
  - [ ] Consent management
- [ ] State-level privacy laws (CCPA, VCDPA, etc.)
  - [ ] "Do Not Sell My Information" disclosure
  - [ ] Opt-out mechanisms

### Terms of Service

- [ ] Create Terms of Service document
  - [ ] User responsibilities
  - [ ] Acceptable use policy
  - [ ] Limitation of liability
  - [ ] Dispute resolution
  - [ ] Account termination policies
- [ ] Age restrictions and parental consent requirements
- [ ] Intellectual property notices

### Liability & Safety

- [ ] Medical liability disclaimers
  - [ ] Medical information is for trip planning only
  - [ ] Not a substitute for professional medical advice
  - [ ] Emergency contact information accuracy disclaimer
- [ ] Activity risk disclaimers
  - [ ] Inherent risks of outdoor activities
  - [ ] BSA/Scouting America insurance requirements
  - [ ] Participant assumption of risk
- [ ] Photo/video release consent
  - [ ] Permission to photograph participants
  - [ ] Usage rights for promotional materials
  - [ ] Opt-out mechanism

### Scouting America Compliance

- [ ] BSA/Scouting America branding guidelines
  - [ ] Proper use of logos and trademarks
  - [ ] Official organization name usage
- [ ] Youth Protection Training verification tracking
- [ ] Two-deep leadership compliance documentation
- [ ] Background check requirement disclosures

### Accessibility Compliance

- [ ] ADA (Americans with Disabilities Act) compliance
- [ ] Accessibility statement publication

### Security & Data Breach

- [ ] Data breach notification procedures
- [ ] Incident response plan
- [ ] Security measures disclosure
- [ ] Data encryption standards

### Required Notices & Disclosures

- [ ] Display Terms of Service link in footer
- [ ] Display Privacy Policy link in footer
- [ ] Cookie consent banner (if using tracking cookies)
- [ ] Contact information for legal inquiries
- [ ] Data protection officer contact (if applicable)
- [ ] Last updated dates for all legal documents

### User Consent Flows

- [ ] Accept Terms of Service during account creation
- [ ] Privacy Policy acknowledgment
- [ ] Parental consent workflow for minors
- [ ] Photo/video release consent checkboxes
- [ ] Medical information accuracy acknowledgment

## Troop Management

- [ ] Add troop management interface (ability to add troop numbers, chartering orgs, and meeting locations)
- [ ] Add troop configuration interface
- [ ] Add option to restrict signup by troop for outings

## User Management

- [ ] Ability to see registered users
- [ ] Ability to promote to admin role

## Family Management

- [ ] ability for two or more family members to share common pool of scouts and sign each other up for outings
- [ ] should be able to see each others' signups (if other user allows it)
- [ ] should have ability to link family accounts (need some mutual acceptance)

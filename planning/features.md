# New Features

## Signup Configuration

Enhancements to family profile and requests

- [x] Add grubmaster request functionality
  - [x] trip admin approves grubmasters
- [ ] Add gear request functionality
- [x] Store emergency contact information and phone number with account
  - [x] If the user updates during signup, update the account
  - [x] Created Profile page for users to view and edit contact information

## Troop Management

- [ ] Add option to restrict signup by troop for outings
- [ ] Families choose troop from dropdown when setting up members
- [ ] Ability to import troop rosters with patrols
  - [ ] Can update troop roster as troop or patrols change
  - [ ] When parents are setting up family members, suggest linking to existing scouts from roster

## Family Management

- [ ] ability for two or more family members to share common pool of scouts and sign each other up for outings (marriage/partnership)
- [ ] should be able to see each others' signups (if other user allows it)
- [ ] should have ability to link family accounts (need some mutual acceptance)
- [ ] there should also be some way for e.g. divorced couples to both have their own accounts, but manage shared scouts signups to prevent duplication

## Tenting manager

- [ ] ensures that scouts are within two years of each other when tenting
- [ ] prevents scouts with different sexes from tenting together
- [ ] prefers scouts in the same patrol to tent together
- [ ] keeps it to 2-3 scouts per tent (2 preferred, 3 if needed due to odd number of scouts)

## Accessibility Improvements

Make the app more accessible for all users

- [ ] Conduct comprehensive accessibility audit
- [x] Implement WCAG 2.1 AA compliance
- [x] Add keyboard navigation support (collapsible sections, interactive elements)
- [x] Add screen reader support (aria-live regions, aria-labels, aria-expanded)
- [x] Improve color contrast ratios (high-contrast theme added)
- [x] Add ARIA labels and landmarks (basic implementation complete)
  - [x] Menu roles and menuitems in navigation
  - [x] Dialog roles for modals
  - [x] Button roles for interactive elements
  - [x] Aria-expanded for collapsible sections
  - [x] Aria-labels for icon buttons and actions
- [x] Add focus indicators for all interactive elements
- [x] Test with screen readers (NVDA, JAWS, VoiceOver)
- [x] Add skip navigation links
- [x] High-contrast theme (yellow on black, WCAG AAA compliant)

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

# Hardcoded Colors That Need Theme Variables

This document lists all hardcoded colors found in the codebase that should be replaced with theme variables for proper dark mode support.

## Priority 1: High Visibility Components

### App.tsx (Homepage)
- Line 42: `backgroundColor: '#e3f2fd'` → `var(--alert-info-bg)`
- Line 75: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`

### SignupWizard.tsx
- Line 458: `backgroundColor: '#e3f2fd'` → `var(--alert-info-bg)`
- Line 472: `backgroundColor: '#e8f5e9'` → `var(--alert-success-bg)`
- Line 484: `backgroundColor: '#fff3e0'` → `var(--alert-warning-bg)`
- Line 501: `backgroundColor: '#ffebee'` → `var(--alert-error-bg)`
- Line 511: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 587: `backgroundColor: '#f1f8f4'` → `var(--alert-success-bg)`
- Line 615: `backgroundColor: '#e3f2fd'` → `var(--badge-scout-bg)`
- Line 656: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 678: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 844: `backgroundColor: '#fff3e0'` → `var(--alert-warning-bg)`
- Line 858: `backgroundColor: '#fff3e0'` → `var(--alert-warning-bg)`
- Line 872: `backgroundColor: '#fff3e0'` → `var(--alert-warning-bg)`
- Line 1016: `backgroundColor: '#e3f2fd'` → `var(--alert-info-bg)`
- Line 1032: `backgroundColor: '#e3f2fd'` → `var(--alert-info-bg)`
- Line 1093: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`

### FamilyManagement.tsx
- Line 169: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 452: `backgroundColor: '#e3f2fd'` → `var(--badge-scout-bg)`
- Line 472: `backgroundColor: '#ffebee'` → `var(--alert-error-bg)`
- Line 620: `backgroundColor: '#ffebee'` → `var(--alert-error-bg)`
- Line 886: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 986: `backgroundColor: '#ffebee'` → `var(--alert-error-bg)`
- Line 1050: `backgroundColor: '#e0e0e0'` → `var(--btn-secondary-bg)`

### BackendHealthCheck.tsx
- Line 45: `backgroundColor: '#fafafa'` → `var(--bg-secondary)`
- Line 76: `backgroundColor: '#fafafa'` → `var(--bg-secondary)`
- Line 109: `backgroundColor: '#fff3e0'` → `var(--alert-warning-bg)`
- Line 120: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 121: `backgroundColor: '#f5f5f5'` → `var(--bg-tertiary)`
- Line 127: `backgroundColor: '#ffebee'` → `var(--alert-error-bg)`

## Priority 2: Admin Components

### OutingAdmin.tsx
- Multiple instances of hardcoded colors for alerts, badges, and backgrounds
- Should use theme variables throughout

## Priority 3: Other Components

### FamilySetupPage.tsx
### SignupForm.tsx
### SWRUsageExamples.tsx

## Recommended Replacements

```typescript
// Backgrounds
'#f5f5f5' → 'var(--bg-tertiary)'
'#fafafa' → 'var(--bg-secondary)'
'#ffffff' → 'var(--bg-primary)'

// Alerts
'#e8f5e9' → 'var(--alert-success-bg)'
'#ffebee' → 'var(--alert-error-bg)'
'#fff3e0' → 'var(--alert-warning-bg)'
'#e3f2fd' → 'var(--alert-info-bg)'

// Badges
'#e3f2fd' (for scouts) → 'var(--badge-scout-bg)'
'#f3e5f5' (for adults) → 'var(--badge-adult-bg)'

// Buttons
'#e0e0e0' → 'var(--btn-secondary-bg)'

// Text Colors (also need updating)
'#333' → 'var(--text-primary)'
'#666' → 'var(--text-secondary)'
'#999' → 'var(--text-muted)'
```

## Action Items

1. Replace all hardcoded background colors with theme variables
2. Replace all hardcoded text colors with theme variables
3. Replace all hardcoded border colors with theme variables
4. Test in both light and dark modes
5. Ensure proper contrast ratios

## Notes

- Some colors like `#1976d2` (old blue) should be replaced with `var(--sa-dark-blue)`
- Alert colors should use semantic variables for consistency
- All inline styles should prefer theme variables over hardcoded hex values
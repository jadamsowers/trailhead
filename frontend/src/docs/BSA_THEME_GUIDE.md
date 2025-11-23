# BSA Brand Theme System

This document describes the comprehensive theme system based on official BSA brand guidelines.

## Core Brand Colors

The theme is built around three primary BSA brand colors:

### Scouts BSA Tan
- **HEX:** `#D6CEBD`
- **RGB:** `214, 206, 189`
- **Usage:** Warm, neutral base for backgrounds and secondary elements
- **Variable:** `--bsa-tan`

### Scouts BSA Red
- **HEX:** `#CE1126`
- **RGB:** `206, 17, 38`
- **Usage:** Bold accent for calls-to-action and important elements
- **Variable:** `--bsa-red`

### Scouts BSA Olive
- **HEX:** `#243E2C`
- **RGB:** `36, 62, 44`
- **Usage:** Natural, grounded color for primary actions
- **Variable:** `--bsa-olive`

## Additional Scouting America Colors

### Scouting America Pale Blue
- **HEX:** `#9AB3D5`
- **RGB:** `154, 179, 213`
- **Variable:** `--sa-pale-blue`

### Scouting America Blue
- **HEX:** `#003366`
- **RGB:** `0, 51, 102`
- **Variable:** `--sa-blue`

### Scouting America Light Tan
- **HEX:** `#E9E9E4`
- **RGB:** `233, 233, 228`
- **Variable:** `--sa-light-tan`

### Scouting America Tan
- **HEX:** `#AD9D7B`
- **RGB:** `173, 157, 123`
- **Variable:** `--sa-tan-alt`

### Scouting America Pale Gray
- **HEX:** `#858787`
- **RGB:** `133, 135, 135`
- **Variable:** `--sa-pale-gray`

### Scouting America Dark Gray
- **HEX:** `#232528`
- **RGB:** `35, 37, 40`
- **Variable:** `--sa-dark-gray`

## Color Palettes

Each core brand color has been extended into a full palette (50-900) for maximum flexibility:

### Tan Palette
- `--bsa-tan-50` through `--bsa-tan-900`
- Lightest to darkest shades derived from BSA Tan

### Red Palette
- `--bsa-red-50` through `--bsa-red-900`
- Lightest to darkest shades derived from BSA Red

### Olive Palette
- `--bsa-olive-50` through `--bsa-olive-900`
- Lightest to darkest shades derived from BSA Olive

### Gray Palette
- `--bsa-gray-50` through `--bsa-gray-900`
- Neutral grays complementary to BSA colors

## Semantic Color Mappings

### Light Theme (Default)

#### Primary (Main Actions)
- **Color:** BSA Olive (`--bsa-olive-500`)
- **Usage:** Primary buttons, main navigation, key actions
- **Variables:** `--color-primary`, `--color-primary-light`, `--color-primary-dark`

#### Secondary (Supporting Actions)
- **Color:** BSA Tan (`--bsa-tan-500`)
- **Usage:** Secondary buttons, alternative actions
- **Variables:** `--color-secondary`, `--color-secondary-light`, `--color-secondary-dark`

#### Accent (Calls-to-Action)
- **Color:** BSA Red (`--bsa-red-500`)
- **Usage:** Important CTAs, alerts, emphasis
- **Variables:** `--color-accent`, `--color-accent-light`, `--color-accent-dark`

#### Success
- **Color:** BSA Olive variations
- **Usage:** Success messages, confirmations
- **Variables:** `--color-success`, `--color-success-light`, `--color-success-dark`

#### Error/Danger
- **Color:** BSA Red variations
- **Usage:** Error messages, warnings, destructive actions
- **Variables:** `--color-error`, `--color-error-light`, `--color-error-dark`

### Dark Theme

The dark theme automatically adjusts all colors for optimal visibility on dark backgrounds:

- **Primary:** Lighter olive shades (`--bsa-olive-400`)
- **Secondary:** Lighter tan shades (`--bsa-tan-400`)
- **Accent:** Lighter red shades (`--bsa-red-400`)
- **Backgrounds:** Dark olive-tinted grays
- **Text:** Light tan shades for readability

## Component-Specific Variables

### Buttons
```css
--btn-primary-bg
--btn-primary-text
--btn-primary-hover
--btn-secondary-bg
--btn-secondary-text
--btn-secondary-hover
--btn-danger-bg
--btn-danger-text
--btn-danger-hover
--btn-disabled-bg
--btn-disabled-text
```

### Cards
```css
--card-bg
--card-border
--card-shadow
--card-hover-shadow
--card-error-bg
--card-success-bg
```

### Forms
```css
--input-bg
--input-border
--input-border-focus
--input-text
--input-placeholder
```

### Alerts
```css
--alert-success-bg
--alert-success-border
--alert-success-text
--alert-error-bg
--alert-error-border
--alert-error-text
--alert-warning-bg
--alert-warning-border
--alert-warning-text
--alert-info-bg
--alert-info-border
--alert-info-text
```

### Badges/Tags
```css
--badge-primary-bg
--badge-primary-text
--badge-primary-border
--badge-secondary-bg
--badge-secondary-text
--badge-secondary-border
--badge-accent-bg
--badge-accent-text
--badge-accent-border
```

## Theme Switching

### Manual Theme Selection
Set the `data-theme` attribute on the root element:

```html
<!-- Light theme -->
<html data-theme="light">

<!-- Dark theme -->
<html data-theme="dark">
```

### Automatic Theme Detection
The theme automatically respects the user's system preference via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  /* Dark theme variables applied automatically */
}
```

## Utility Classes

### Background Colors
```css
.bg-primary
.bg-secondary
.bg-tertiary
.bg-dark
.bg-bsa-tan
.bg-bsa-red
.bg-bsa-olive
.bg-sa-blue
.bg-sa-pale-blue
.bg-sa-light-tan
```

### Text Colors
```css
.text-primary
.text-secondary
.text-light
.text-muted
.text-link
.text-bsa-tan
.text-bsa-red
.text-bsa-olive
.text-sa-blue
.text-sa-pale-blue
```

### Border Colors
```css
.border-primary
.border-accent
.border-success
.border-error
```

## Usage Examples

### Primary Button
```tsx
<button className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]">
  Primary Action
</button>
```

### Success Alert
```tsx
<div className="bg-[var(--alert-success-bg)] border-[var(--alert-success-border)] text-[var(--alert-success-text)]">
  Success message
</div>
```

### Card with BSA Branding
```tsx
<div className="bg-[var(--card-bg)] border-[var(--card-border)] shadow-[var(--card-shadow)]">
  <h2 className="text-bsa-olive">Card Title</h2>
  <p className="text-secondary">Card content</p>
</div>
```

## Best Practices

1. **Use Semantic Variables:** Prefer semantic variables (`--color-primary`) over direct color references
2. **Respect Brand Guidelines:** Use BSA brand colors for primary elements
3. **Test Both Themes:** Always test components in both light and dark modes
4. **Maintain Contrast:** Ensure sufficient contrast ratios for accessibility
5. **Use Utility Classes:** Leverage utility classes for consistent styling

## Migration from Old Theme

Legacy variables are maintained for backward compatibility:

```css
--sa-dark-blue → --bsa-olive-500
--sa-tan → --bsa-tan-500
--scouts-tan → --bsa-tan-300
--scouts-red → --bsa-red-500
--scouts-olive → --bsa-olive-500
```

Gradually migrate to the new BSA-prefixed variables for better clarity and consistency.
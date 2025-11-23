# Theme Customization Guide

## Overview

The Scouting Outing Manager uses a comprehensive theming system based on official Scouting America and Scouts BSA brand colors. The theme supports both light and dark modes with automatic system preference detection and localStorage persistence.

## Quick Start

### Using the Theme Toggle

Add the theme toggle component to your app:

```tsx
import { ThemeToggle, ThemeToggleCompact, ThemeSelector } from './components/Shared/ThemeToggle';

// Full toggle with text
<ThemeToggle />

// Compact icon-only toggle
<ThemeToggleCompact />

// Full selector with light/dark/auto options
<ThemeSelector />
```

### Programmatic Theme Control

```tsx
import { useTheme } from './utils/themeManager';

function MyComponent() {
    const { theme, effectiveTheme, setTheme, toggleTheme, isDark, isLight } = useTheme();
    
    // Get current theme preference ('light', 'dark', or 'auto')
    console.log('Theme preference:', theme);
    
    // Get actual applied theme ('light' or 'dark')
    console.log('Effective theme:', effectiveTheme);
    
    // Set specific theme
    setTheme('dark');
    
    // Toggle between light and dark
    toggleTheme();
    
    // Check current mode
    if (isDark) {
        console.log('Dark mode is active');
    }
}
```

## Color Palette

### Scouting America Colors

#### Primary Blues
- **Pale Blue**: `#9AB3D5` - Light accents, backgrounds
- **Dark Blue**: `#003366` - Primary brand color, buttons, headers
- CSS Variables: `--sa-pale-blue`, `--sa-dark-blue`

#### Neutral Tans
- **Light Tan**: `#E9E9E4` - Light backgrounds
- **Tan**: `#AD9D7B` - Secondary elements
- **Dark Tan**: `#8B7D5F` - Darker accents
- CSS Variables: `--sa-light-tan`, `--sa-tan`, `--sa-dark-tan`

#### Grays
- **Pale Gray**: `#858787` - Borders, muted text
- **Gray**: `#5A5C5C` - Medium gray
- **Dark Gray**: `#232528` - Dark backgrounds, primary text
- CSS Variables: `--sa-pale-gray`, `--sa-gray`, `--sa-dark-gray`

### Scouts BSA Colors

- **Tan**: `#D6CEBD` - Accent backgrounds
- **Red**: `#CE1126` - Error states, important actions
- **Olive**: `#243E2C` - Success states, confirmations
- CSS Variables: `--scouts-tan`, `--scouts-red`, `--scouts-olive`

## Using Theme Variables

### In CSS

```css
.my-component {
    /* Background colors */
    background-color: var(--bg-primary);
    
    /* Text colors */
    color: var(--text-primary);
    
    /* Borders */
    border: 1px solid var(--border-light);
    
    /* Buttons */
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    
    /* Spacing */
    padding: var(--spacing-md);
    margin: var(--spacing-lg);
    
    /* Border radius */
    border-radius: var(--border-radius-md);
    
    /* Shadows */
    box-shadow: var(--shadow-md);
    
    /* Transitions */
    transition: all var(--transition-base);
}
```

### In Inline Styles (React)

```tsx
<div style={{
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border-light)'
}}>
    Content
</div>
```

## Semantic Color Variables

### Backgrounds
- `--bg-primary` - Main background (white/dark gray)
- `--bg-secondary` - Secondary background (light tan/darker gray)
- `--bg-tertiary` - Tertiary background (scouts tan/medium gray)
- `--bg-dark` - Dark background (dark gray/black)

### Text
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--text-light` - Light text (for dark backgrounds)
- `--text-muted` - Muted/disabled text
- `--text-link` - Link color
- `--text-link-hover` - Link hover color

### Buttons
- `--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover`
- `--btn-secondary-bg`, `--btn-secondary-text`, `--btn-secondary-hover`
- `--btn-success-bg`, `--btn-success-text`, `--btn-success-hover`
- `--btn-danger-bg`, `--btn-danger-text`, `--btn-danger-hover`

### Alerts
- `--alert-success-bg`, `--alert-success-border`, `--alert-success-text`
- `--alert-error-bg`, `--alert-error-border`, `--alert-error-text`
- `--alert-warning-bg`, `--alert-warning-border`, `--alert-warning-text`
- `--alert-info-bg`, `--alert-info-border`, `--alert-info-text`

### Badges
- `--badge-adult-bg`, `--badge-adult-text`, `--badge-adult-border`
- `--badge-scout-bg`, `--badge-scout-text`, `--badge-scout-border`

## Spacing System

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
```

## Border Radius

```css
--border-radius-sm: 4px
--border-radius-md: 6px
--border-radius-lg: 8px
--border-radius-xl: 12px
--border-radius-full: 9999px
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

## Typography

### Font Families
- `--font-family-base` - System font stack for body text
- `--font-family-mono` - Monospace font for code

### Font Sizes
```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-base: 1rem     /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
--font-size-4xl: 2.25rem   /* 36px */
```

### Font Weights
```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

## Dark Mode

### How It Works

1. **Explicit Preference**: User selects light/dark mode → saved to localStorage
2. **Auto Mode**: Follows system preference → updates automatically when system changes
3. **No Preference**: Defaults to system preference

### Implementation

Dark mode is applied via the `data-theme` attribute on the root element:

```html
<html data-theme="dark">
```

The theme manager automatically:
- Reads localStorage on app load
- Applies the appropriate theme
- Watches for system preference changes (if in auto mode)
- Persists user preference

### Customizing Dark Mode Colors

Edit [`theme.css`](../theme.css:195) to customize dark mode colors:

```css
[data-theme="dark"] {
    --bg-primary: var(--sa-dark-gray);
    --text-primary: var(--sa-light-tan);
    /* ... other overrides */
}
```

## Utility Classes

### Background Colors
```css
.bg-primary { background-color: var(--bg-primary); }
.bg-secondary { background-color: var(--bg-secondary); }
.bg-sa-blue { background-color: var(--sa-dark-blue); }
.bg-sa-tan { background-color: var(--sa-tan); }
```

### Text Colors
```css
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-sa-blue { color: var(--sa-dark-blue); }
.text-scouts-red { color: var(--scouts-red); }
```

### Border Colors
```css
.border-primary { border-color: var(--border-primary); }
.border-success { border-color: var(--border-success); }
.border-error { border-color: var(--border-error); }
```

## Customization Examples

### Custom Button

```tsx
<button style={{
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderRadius: 'var(--border-radius-md)',
    border: 'none',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-semibold)',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    boxShadow: 'var(--shadow-sm)'
}}>
    Click Me
</button>
```

### Custom Card

```tsx
<div style={{
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--border-radius-lg)',
    padding: 'var(--spacing-xl)',
    boxShadow: 'var(--shadow-md)',
    transition: 'box-shadow var(--transition-base)'
}}>
    <h3 style={{ color: 'var(--text-primary)' }}>Card Title</h3>
    <p style={{ color: 'var(--text-secondary)' }}>Card content</p>
</div>
```

### Custom Alert

```tsx
<div style={{
    backgroundColor: 'var(--alert-success-bg)',
    border: '2px solid var(--alert-success-border)',
    color: 'var(--alert-success-text)',
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: 'var(--font-size-sm)'
}}>
    ✓ Success message
</div>
```

## Modifying the Theme

### Changing Brand Colors

Edit [`theme.css`](../theme.css:1) and update the color values in the `:root` selector:

```css
:root {
    /* Change primary blue */
    --sa-dark-blue: #YOUR_COLOR;
    
    /* Change accent tan */
    --sa-tan: #YOUR_COLOR;
    
    /* etc. */
}
```

### Adding New Colors

Add new variables to [`theme.css`](../theme.css:1):

```css
:root {
    /* Your custom colors */
    --custom-purple: #8B5CF6;
    --custom-green: #10B981;
}
```

Then use them in your components:

```tsx
<div style={{ color: 'var(--custom-purple)' }}>
    Custom colored text
</div>
```

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Use semantic variables** (`--text-primary`) over direct colors (`--sa-dark-blue`)
3. **Test in both light and dark modes** before deploying
4. **Use spacing variables** for consistent spacing
5. **Use transition variables** for consistent animations
6. **Provide theme toggle** in user-accessible location (header/settings)

## Troubleshooting

### Theme not applying
- Check that `initializeTheme()` is called in [`index.tsx`](../index.tsx:7)
- Verify [`theme.css`](../theme.css:1) is imported in [`index.css`](../index.css:4)
- Check browser console for errors

### Dark mode not working
- Verify `data-theme` attribute is set on `<html>` element
- Check localStorage for `scouting-theme-preference` key
- Ensure dark mode overrides are defined in [`theme.css`](../theme.css:195)

### Colors not updating
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Check CSS variable names match exactly

## Files Reference

- [`theme.css`](../theme.css:1) - All theme variables and dark mode
- [`themeManager.ts`](../utils/themeManager.ts:1) - Theme logic and React hook
- [`ThemeToggle.tsx`](../components/Shared/ThemeToggle.tsx:1) - Theme toggle components
- [`index.css`](../index.css:1) - Global styles using theme variables
- [`index.tsx`](../index.tsx:1) - Theme initialization

## Additional Resources

- [Scouting America Brand Guidelines](https://www.scouting.org/resources/brand/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
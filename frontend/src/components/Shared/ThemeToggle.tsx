import React from 'react';
import { useTheme } from '../../utils/themeManager';

/**
 * Theme Toggle Component
 * 
 * Provides a button to toggle between light and dark themes.
 * Theme preference is saved to localStorage.
 */
export const ThemeToggle: React.FC = () => {
    const { theme, effectiveTheme, setTheme, toggleTheme, isDark } = useTheme();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
                onClick={toggleTheme}
                style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--btn-secondary-bg)',
                    color: 'var(--btn-secondary-text)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
                <span style={{ fontSize: '18px' }}>
                    {isDark ? '☀️' : '🌙'}
                </span>
                <span>
                    {isDark ? 'Light' : 'Dark'} Mode
                </span>
            </button>
            
            {/* Optional: Show current theme preference */}
            {theme === 'auto' && (
                <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic'
                }}>
                    (Auto: {effectiveTheme})
                </span>
            )}
        </div>
    );
};

/**
 * Compact Theme Toggle (Icon Only)
 * 
 * A smaller version with just an icon, suitable for headers/navbars
 */
export const ThemeToggleCompact: React.FC = () => {
    const { toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                padding: '8px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
            }}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    );
};

/**
 * Theme Selector with All Options
 * 
 * Provides a dropdown to select between light, dark, and auto modes
 */
export const ThemeSelector: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-primary)'
            }}>
                Theme Preference
            </label>
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--input-text)',
                    border: '1px solid var(--input-border)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer'
                }}
            >
                <option value="light">☀️ Light Mode</option>
                <option value="dark">🌙 Dark Mode</option>
                <option value="auto">🔄 Auto (System)</option>
            </select>
            <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                margin: 0
            }}>
                {theme === 'auto' 
                    ? 'Theme will match your system preference'
                    : `Always use ${theme} mode`
                }
            </p>
        </div>
    );
};

export default ThemeToggle;
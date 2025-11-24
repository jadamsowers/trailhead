/**
 * Theme Manager
 *
 * Manages theme switching between light, dark, and high-contrast modes with localStorage persistence.
 */

export type Theme = "light" | "dark" | "auto" | "high-contrast";

const THEME_STORAGE_KEY = "scouting-theme-preference";

/**
 * Get the current theme preference from localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (
    stored === "light" ||
    stored === "dark" ||
    stored === "auto" ||
    stored === "high-contrast"
  ) {
    return stored as Theme;
  }
  return null;
}

/**
 * Save theme preference to localStorage
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(THEME_STORAGE_KEY, theme);
  console.log("🎨 Theme preference saved:", theme);
}

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Get the effective theme (resolving 'auto' to actual theme)
 */
export function getEffectiveTheme(
  preference: Theme | null
): "light" | "dark" | "high-contrast" {
  if (
    preference === "light" ||
    preference === "dark" ||
    preference === "high-contrast"
  ) {
    return preference;
  }
  // If preference is 'auto' or null, use system preference
  return getSystemTheme();
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme: "light" | "dark" | "high-contrast"): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (theme === "high-contrast") {
    root.setAttribute("data-theme", "high-contrast");
    console.log("🟡 High Contrast mode applied");
  } else if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    console.log("🌙 Dark mode applied");
  } else {
    root.setAttribute("data-theme", "light");
    console.log("☀️ Light mode applied");
  }
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): void {
  const storedPreference = getStoredTheme();
  const effectiveTheme = getEffectiveTheme(storedPreference);

  console.log("🎨 Initializing theme:", {
    stored: storedPreference,
    effective: effectiveTheme,
    system: getSystemTheme(),
  });

  applyTheme(effectiveTheme);

  // Listen for system theme changes if preference is 'auto' or not set
  if (storedPreference === "auto" || storedPreference === null) {
    watchSystemTheme();
  }
}

/**
 * Set theme preference and apply it
 */
export function setTheme(theme: Theme): void {
  setStoredTheme(theme);
  const effectiveTheme = getEffectiveTheme(theme);
  applyTheme(effectiveTheme);

  // Start/stop watching system theme based on preference
  if (theme === "auto") {
    watchSystemTheme();
  } else {
    unwatchSystemTheme();
  }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
  const current = getStoredTheme();
  const effectiveTheme = getEffectiveTheme(current);

  // Toggle to opposite of current effective theme
  const newTheme: Theme = effectiveTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

/**
 * Get current theme preference
 */
export function getCurrentTheme(): Theme {
  return getStoredTheme() || "auto";
}

/**
 * Get current effective theme (light, dark, or high-contrast)
 */
export function getCurrentEffectiveTheme(): "light" | "dark" | "high-contrast" {
  const preference = getStoredTheme();
  return getEffectiveTheme(preference);
}

// System theme watcher
let systemThemeMediaQuery: MediaQueryList | null = null;
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Watch for system theme changes
 */
function watchSystemTheme(): void {
  if (typeof window === "undefined") return;

  // Clean up existing listener
  unwatchSystemTheme();

  systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  systemThemeListener = (e: MediaQueryListEvent) => {
    const storedPreference = getStoredTheme();
    // Only apply if preference is 'auto' or not set
    if (storedPreference === "auto" || storedPreference === null) {
      const newTheme = e.matches ? "dark" : "light";
      console.log("🎨 System theme changed:", newTheme);
      applyTheme(newTheme);
    }
  };

  systemThemeMediaQuery.addEventListener("change", systemThemeListener);
  console.log("👀 Watching system theme changes");
}

/**
 * Stop watching system theme changes
 */
function unwatchSystemTheme(): void {
  if (systemThemeMediaQuery && systemThemeListener) {
    systemThemeMediaQuery.removeEventListener("change", systemThemeListener);
    systemThemeMediaQuery = null;
    systemThemeListener = null;
    console.log("👋 Stopped watching system theme changes");
  }
}

/**
 * React hook for theme management
 */
export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>(getCurrentTheme);
  const [effectiveTheme, setEffectiveTheme] = React.useState<
    "light" | "dark" | "high-contrast"
  >(getCurrentEffectiveTheme);

  React.useEffect(() => {
    // Initialize theme on mount
    initializeTheme();

    // Update state if theme changes externally
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const newTheme = getStoredTheme() || "auto";
        setThemeState(newTheme);
        setEffectiveTheme(getEffectiveTheme(newTheme));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unwatchSystemTheme();
    };
  }, []);

  const changeTheme = React.useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setThemeState(newTheme);
    setEffectiveTheme(getEffectiveTheme(newTheme));
  }, []);

  const toggle = React.useCallback(() => {
    // Cycle through light -> dark -> high-contrast -> light
    const current = getCurrentTheme();
    const effectiveCurrent = getEffectiveTheme(current);
    let newTheme: Theme;
    if (effectiveCurrent === "light") {
      newTheme = "dark";
    } else if (effectiveCurrent === "dark") {
      newTheme = "high-contrast";
    } else {
      newTheme = "light";
    }
    setTheme(newTheme);
    setThemeState(newTheme);
    setEffectiveTheme(getEffectiveTheme(newTheme));
  }, []);

  return {
    theme,
    effectiveTheme,
    setTheme: changeTheme,
    toggleTheme: toggle,
    isLight: effectiveTheme === "light",
    isDark: effectiveTheme === "dark",
    isHighContrast: effectiveTheme === "high-contrast",
  };
}

// Import React for the hook
import React from "react";

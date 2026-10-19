import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({
  isDarkMode: false,
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEYS = ["terra_theme", "terrachain_theme"];

/**
 * Safely reads the saved theme preference from local storage.
 * Supports 'terra_theme' and legacy 'terrachain_theme'.
 */
export function getStoredTheme() {
  try {
    for (const key of STORAGE_KEYS) {
      const val = localStorage.getItem(key);
      if (val === "dark") return "dark";
      if (val === "light") return "light";
    }
  } catch (e) {
    console.warn("Could not read theme from localStorage", e);
  }
  return null;
}

/**
 * Saves the theme preference across all supported keys in local storage.
 */
export function saveStoredTheme(theme) {
  try {
    for (const key of STORAGE_KEYS) {
      localStorage.setItem(key, theme);
    }
  } catch (e) {
    console.warn("Could not save theme to localStorage", e);
  }
}

export function ThemeProvider({ children }) {
  // Respect saved user preference. If none, preserve the existing application default (light mode / false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = getStoredTheme();
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return false;
  });

  // Keep document.documentElement synchronized immediately with the active theme state
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      const nextTheme = next ? "dark" : "light";
      saveStoredTheme(nextTheme);
      return next;
    });
  }, []);

  const setTheme = useCallback((theme) => {
    const isDark = theme === "dark";
    setIsDarkMode(isDark);
    saveStoredTheme(isDark ? "dark" : "light");
  }, []);

  const value = {
    isDarkMode,
    theme: isDarkMode ? "dark" : "light",
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;

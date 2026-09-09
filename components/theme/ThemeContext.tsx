"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "bookie-theme";

/** Inline script string — runs before paint to set the .dark class without flashing. */
export const themeInitScript = `
(function(){try{
  var t = localStorage.getItem("${STORAGE_KEY}") || "system";
  var dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}catch(e){}})();
`;
const THEME_EVENT = "bookie:theme-change";

const media = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

function subscribeTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function getThemeSnapshot(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function getServerTheme(): Theme {
  return "system";
}

function subscribeSystemDark(onChange: () => void) {
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

function getSystemDark(): boolean {
  return media?.matches ?? false;
}

function getServerSystemDark(): boolean {
  return false;
}

/**
 * The theme is an external store (localStorage + system preference), so it is
 * read with useSyncExternalStore — no setState-in-effect cascades, and the
 * inline init script in app/layout.tsx already applied the class pre-paint.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerTheme);
  const systemDark = useSyncExternalStore(subscribeSystemDark, getSystemDark, getServerSystemDark);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Keep the <html> class in sync (the init script handles the pre-paint case).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

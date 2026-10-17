"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  getStoredThemeSelection,
  getSystemPrefersDark,
  persistThemeSelection,
  resolveThemeId,
  type ThemeId,
  type ThemeSelection,
} from "@/lib/theme";

interface ThemeContextValue {
  selection: ThemeSelection;
  resolvedId: ThemeId;
  hydrated: boolean;
  setSelection: (selection: ThemeSelection) => void;
  setThemeId: (themeId: ThemeId) => void;
  useSystem: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** SSR-safe defaults — must match server HTML until client hydration completes. */
const SSR_THEME_SELECTION: ThemeSelection = "system";
const SSR_PREFERS_DARK = true;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] =
    useState<ThemeSelection>(SSR_THEME_SELECTION);
  const [prefersDark, setPrefersDark] = useState(SSR_PREFERS_DARK);
  const [hydrated, setHydrated] = useState(false);

  const resolvedId = useMemo(
    () => resolveThemeId(selection, prefersDark),
    [selection, prefersDark],
  );

  useEffect(() => {
    setSelectionState(getStoredThemeSelection());
    setPrefersDark(getSystemPrefersDark());
    setHydrated(true);
  }, []);

  useEffect(() => {
    applyTheme(selection, resolvedId);
    if (hydrated) persistThemeSelection(selection);
  }, [selection, resolvedId, hydrated]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setSelection = useCallback((next: ThemeSelection) => {
    setSelectionState(next);
  }, []);

  const setThemeId = useCallback((themeId: ThemeId) => {
    setSelectionState(themeId);
  }, []);

  const useSystem = useCallback(() => {
    setSelectionState("system");
  }, []);

  const value = useMemo(
    () => ({
      selection,
      resolvedId,
      hydrated,
      setSelection,
      setThemeId,
      useSystem,
    }),
    [selection, resolvedId, hydrated, setSelection, setThemeId, useSystem],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

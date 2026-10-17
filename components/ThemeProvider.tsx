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
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] =
    useState<ThemeSelection>(SSR_THEME_SELECTION);
  const [hydrated, setHydrated] = useState(false);

  const resolvedId = useMemo(() => resolveThemeId(selection), [selection]);

  useEffect(() => {
    setSelectionState(getStoredThemeSelection());
    setHydrated(true);
  }, []);

  useEffect(() => {
    applyTheme(selection, resolvedId);
    if (hydrated) persistThemeSelection(selection);
  }, [selection, resolvedId, hydrated]);

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

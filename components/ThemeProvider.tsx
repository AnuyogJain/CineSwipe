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
  applyAppearance,
  getStoredThemeSelection,
  getStoredUiMode,
  persistThemeSelection,
  persistUiMode,
  resolveThemeId,
  type ThemeId,
  type ThemeSelection,
  type UiMode,
} from "@/lib/theme";

interface ThemeContextValue {
  selection: ThemeSelection;
  resolvedId: ThemeId;
  uiMode: UiMode;
  isMinimal: boolean;
  hydrated: boolean;
  setSelection: (selection: ThemeSelection) => void;
  setThemeId: (themeId: ThemeId) => void;
  useSystem: () => void;
  setUiMode: (mode: UiMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** SSR-safe defaults — must match server HTML until client hydration completes. */
const SSR_THEME_SELECTION: ThemeSelection = "system";
const SSR_UI_MODE: UiMode = "minimal";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] =
    useState<ThemeSelection>(SSR_THEME_SELECTION);
  const [uiMode, setUiModeState] = useState<UiMode>(SSR_UI_MODE);
  const [hydrated, setHydrated] = useState(false);

  const resolvedId = useMemo(() => resolveThemeId(selection), [selection]);
  const isMinimal = uiMode === "minimal";

  useEffect(() => {
    setSelectionState(getStoredThemeSelection());
    setUiModeState(getStoredUiMode());
    setHydrated(true);
  }, []);

  useEffect(() => {
    applyAppearance(selection, resolvedId, uiMode);
    if (hydrated) {
      persistThemeSelection(selection);
      persistUiMode(uiMode);
    }
  }, [selection, resolvedId, uiMode, hydrated]);

  const setSelection = useCallback((next: ThemeSelection) => {
    setSelectionState(next);
  }, []);

  const setThemeId = useCallback((themeId: ThemeId) => {
    setSelectionState(themeId);
  }, []);

  const useSystem = useCallback(() => {
    setSelectionState("system");
  }, []);

  const setUiMode = useCallback((mode: UiMode) => {
    setUiModeState(mode);
  }, []);

  const value = useMemo(
    () => ({
      selection,
      resolvedId,
      uiMode,
      isMinimal,
      hydrated,
      setSelection,
      setThemeId,
      useSystem,
      setUiMode,
    }),
    [
      selection,
      resolvedId,
      uiMode,
      isMinimal,
      hydrated,
      setSelection,
      setThemeId,
      useSystem,
      setUiMode,
    ],
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

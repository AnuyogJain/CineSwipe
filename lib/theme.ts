export type ThemeId =
  | "dark-midnight"
  | "dark-oled"
  | "dark-amethyst"
  | "light-paper"
  | "light-rose"
  | "light-sand";

export type ThemeSelection = ThemeId | "system";
export type ThemeFamily = "light" | "dark";

export const THEME_STORAGE_KEY = "cineswipe-theme";
export const LEGACY_THEME_STORAGE_KEY = "imdb-taste-theme";

export interface ThemeDefinition {
  id: ThemeId;
  family: ThemeFamily;
  label: string;
  description: string;
  default: boolean;
  swatch: string;
  themeColor: string;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  "dark-midnight": {
    id: "dark-midnight",
    family: "dark",
    label: "Midnight",
    description: "Purple cinema glow",
    default: true,
    swatch: "#1a1024",
    themeColor: "#0a0a0f",
  },
  "dark-oled": {
    id: "dark-oled",
    family: "dark",
    label: "OLED",
    description: "Pure black contrast",
    default: false,
    swatch: "#000000",
    themeColor: "#000000",
  },
  "dark-amethyst": {
    id: "dark-amethyst",
    family: "dark",
    label: "Amethyst",
    description: "Deep violet lounge",
    default: false,
    swatch: "#2e1065",
    themeColor: "#140820",
  },
  "light-paper": {
    id: "light-paper",
    family: "light",
    label: "Paper",
    description: "Clean neutral white",
    default: true,
    swatch: "#fafafa",
    themeColor: "#fafafa",
  },
  "light-rose": {
    id: "light-rose",
    family: "light",
    label: "Rose",
    description: "Soft blush warmth",
    default: false,
    swatch: "#fff1f2",
    themeColor: "#fff1f2",
  },
  "light-sand": {
    id: "light-sand",
    family: "light",
    label: "Sand",
    description: "Warm cream tones",
    default: false,
    swatch: "#faf6ef",
    themeColor: "#faf6ef",
  },
};

export const DARK_THEMES = Object.values(THEMES).filter((t) => t.family === "dark");
export const LIGHT_THEMES = Object.values(THEMES).filter((t) => t.family === "light");

export const DEFAULT_DARK_THEME: ThemeId = "dark-midnight";
export const DEFAULT_LIGHT_THEME: ThemeId = "light-paper";

const LEGACY_MAP: Record<string, ThemeSelection> = {
  light: DEFAULT_LIGHT_THEME,
  dark: DEFAULT_DARK_THEME,
  system: "system",
};

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value != null && value in THEMES;
}

export function isThemeSelection(value: string | null | undefined): value is ThemeSelection {
  return value === "system" || isThemeId(value);
}

export function normalizeThemeSelection(value: string | null | undefined): ThemeSelection {
  if (!value) return "system";
  if (isThemeSelection(value)) return value;
  return LEGACY_MAP[value] ?? "system";
}

export function resolveThemeId(
  selection: ThemeSelection,
  prefersDark = false,
): ThemeId {
  if (selection === "system") {
    return prefersDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  }
  return selection;
}

function readStoredThemeRaw(): string | null {
  const current = localStorage.getItem(THEME_STORAGE_KEY);
  if (current != null) return current;

  const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (legacy == null) return null;

  localStorage.setItem(THEME_STORAGE_KEY, legacy);
  localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  return legacy;
}

export function getStoredThemeSelection(): ThemeSelection {
  if (typeof window === "undefined") return "system";
  try {
    return normalizeThemeSelection(readStoredThemeRaw());
  } catch {
    return "system";
  }
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(selection: ThemeSelection, resolvedId: ThemeId): void {
  const theme = THEMES[resolvedId];
  const root = document.documentElement;

  root.setAttribute("data-theme-mode", selection);
  root.setAttribute("data-theme", resolvedId);
  root.setAttribute("data-theme-family", theme.family);
  root.style.colorScheme = theme.family;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme.themeColor);
  }
}

export function persistThemeSelection(selection: ThemeSelection): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, selection);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Inline boot script — keep in sync with lib/theme.ts */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var lk=${JSON.stringify(LEGACY_THEME_STORAGE_KEY)};var legacy={light:${JSON.stringify(DEFAULT_LIGHT_THEME)},dark:${JSON.stringify(DEFAULT_DARK_THEME)},system:"system"};var raw=localStorage.getItem(k);if(raw==null){raw=localStorage.getItem(lk);if(raw!=null){localStorage.setItem(k,raw);localStorage.removeItem(lk);}}raw=raw||"system";var sel=legacy[raw]||raw;var ids=${JSON.stringify(Object.keys(THEMES))};if(sel!=="system"&&ids.indexOf(sel)<0)sel="system";var dark=matchMedia("(prefers-color-scheme: dark)").matches;var resolved=sel==="system"?(dark?${JSON.stringify(DEFAULT_DARK_THEME)}:${JSON.stringify(DEFAULT_LIGHT_THEME)}):sel;var fam=resolved.indexOf("light-")===0?"light":"dark";document.documentElement.setAttribute("data-theme-mode",sel);document.documentElement.setAttribute("data-theme",resolved);document.documentElement.setAttribute("data-theme-family",fam);document.documentElement.style.colorScheme=fam;}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_DARK_THEME)});document.documentElement.setAttribute("data-theme-family","dark");}})();`;

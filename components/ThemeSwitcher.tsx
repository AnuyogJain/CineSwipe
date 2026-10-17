"use client";

import {
  DARK_THEMES,
  LIGHT_THEMES,
  THEMES,
  type ThemeId,
} from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { selection, resolvedId, setThemeId, useSystem, hydrated } = useTheme();
  const usingSystem = selection === "system";
  const resolved = THEMES[resolvedId];

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact ? (
        <div>
          <h3 className="font-semibold text-foreground">Appearance</h3>
          <p className="mt-1 text-sm text-muted">
            Six curated palettes — three light and three dark, each with a default.
            {hydrated && usingSystem
              ? ` Following device (${resolved.label}).`
              : null}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={useSystem}
        className={`theme-system-toggle${usingSystem ? " theme-system-toggle--active" : ""}`}
        aria-pressed={usingSystem}
      >
        <span className="theme-system-toggle__label">Use system appearance</span>
        <span className="theme-system-toggle__hint">
          {hydrated && usingSystem
            ? `Active · ${resolved.label}`
            : "Matches light/dark on your device"}
        </span>
      </button>

      <ThemeGroup
        title="Dark themes"
        themes={DARK_THEMES}
        activeId={usingSystem ? null : selection}
        resolvedId={resolved.family === "dark" ? resolvedId : null}
        onSelect={setThemeId}
      />

      <ThemeGroup
        title="Light themes"
        themes={LIGHT_THEMES}
        activeId={usingSystem ? null : selection}
        resolvedId={resolved.family === "light" ? resolvedId : null}
        onSelect={setThemeId}
      />
    </div>
  );
}

function ThemeGroup({
  title,
  themes,
  activeId,
  resolvedId,
  onSelect,
}: {
  title: string;
  themes: Array<(typeof THEMES)[ThemeId]>;
  activeId: ThemeId | null;
  resolvedId: ThemeId | null;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{title}</p>
      <div className="theme-grid" role="radiogroup" aria-label={title}>
        {themes.map((theme) => {
          const selected = activeId === theme.id;
          const resolved = resolvedId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(theme.id)}
              className={`theme-card${selected ? " theme-card--active" : ""}${resolved && !selected ? " theme-card--resolved" : ""}`}
            >
              <span
                className="theme-card__swatch"
                style={{ background: theme.swatch }}
                aria-hidden="true"
              />
              <span className="theme-card__label">
                {theme.label}
                {theme.default ? " · default" : ""}
              </span>
              <span className="theme-card__hint">{theme.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

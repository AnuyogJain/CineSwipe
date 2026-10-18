"use client";

import { DARK_THEMES, THEMES, type ThemeId } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    selection,
    resolvedId,
    setThemeId,
    useSystem,
    hydrated,
    uiMode,
    isMinimal,
    setUiMode,
  } = useTheme();
  const usingSystem = selection === "system";
  const resolved = THEMES[resolvedId];

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact ? (
        <div>
          <h3 className="font-semibold text-foreground">Appearance</h3>
          <p className="mt-1 text-sm text-muted">
            Cinema mode uses dark palettes and glass accents. Minimalist mode is
            a clean light layout.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <span>
          <span className="block text-sm font-semibold text-foreground">
            Minimalist mode
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Light surfaces, sharp type, no glow
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isMinimal}
          aria-label="Minimalist mode"
          className="ui-switch"
          onClick={() => setUiMode(isMinimal ? "cinema" : "minimal")}
        >
          <span className="ui-switch__thumb" aria-hidden />
        </button>
      </div>

      {isMinimal ? (
        <p className="settings-appearance-note pt-1">
          Color themes (Midnight, OLED, Amethyst) apply when you turn off
          Minimalist mode.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={useSystem}
            className={`theme-system-toggle${usingSystem ? " theme-system-toggle--active" : ""}`}
            aria-pressed={usingSystem}
          >
            <span className="theme-system-toggle__label">
              Use system appearance
            </span>
            <span className="theme-system-toggle__hint">
              {hydrated && usingSystem
                ? `Active · ${resolved.label}`
                : "Uses Midnight when following system"}
            </span>
          </button>

          <ThemeGroup
            title="Themes"
            themes={DARK_THEMES}
            activeId={usingSystem ? null : selection}
            resolvedId={resolvedId}
            onSelect={setThemeId}
          />
        </>
      )}
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
      <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
        {title}
      </p>
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

"use client";

interface MinimalLoaderProps {
  label: string;
  /** Smaller variant for overlays */
  compact?: boolean;
  /** 0–100; omit for indeterminate slide animation */
  progress?: number;
}

export function MinimalLoader({
  label,
  compact = false,
  progress,
}: MinimalLoaderProps) {
  const determinate =
    progress !== undefined && progress >= 0 && progress <= 100;

  return (
    <div
      className={`minimal-loader${compact ? " minimal-loader--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="minimal-loader__track" aria-hidden="true">
        <div
          className={`minimal-loader__bar${
            determinate ? " minimal-loader__bar--determinate" : ""
          }`}
          style={determinate ? { width: `${progress}%` } : undefined}
        />
      </div>
      <p className="minimal-loader__label">{label}</p>
      {determinate && !compact ? (
        <p className="minimal-loader__percent">{progress}%</p>
      ) : null}
    </div>
  );
}

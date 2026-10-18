import type { ReactNode } from "react";

/** Centered column for sign-in / register (no app header or bottom nav). */
export default function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center overflow-y-auto px-4 py-8">
      <div
        className="auth-page-bg pointer-events-none fixed inset-0 -z-10 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgb(245 197 24 / 0.12), transparent 55%), var(--body-gradient)",
        }}
      />
      <div className="auth-card glass-panel mx-auto w-full max-w-sm rounded-2xl p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}

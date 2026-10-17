import type { ReactNode } from "react";

/** Centered column for sign-in / register (no app header or bottom nav). */
export default function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-4 py-8">
      {children}
    </main>
  );
}

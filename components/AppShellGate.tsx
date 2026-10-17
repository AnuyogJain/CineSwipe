import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { getSessionUser } from "@/lib/auth/session";

const AUTH_PATHS = new Set(["/login", "/register"]);

export async function AppShellGate({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (AUTH_PATHS.has(pathname)) {
    return children;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

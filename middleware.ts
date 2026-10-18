import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { sanitizeRelativeNext } from "@/lib/safe-next-path";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasSession) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const dest = sanitizeRelativeNext(nextParam);
      return NextResponse.redirect(new URL(dest, request.url));
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    const returnPath =
      pathname + (request.nextUrl.search || "");
    login.searchParams.set("next", returnPath || "/");
    return NextResponse.redirect(login);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Coarse gate: redirect to /login if the session cookie is absent.
 * This is a fast, cookie-presence-only check — the authoritative check
 * (account active, cuentaCreada, role) happens in requireAuth() inside the
 * protected layout/Server Actions, per Next's Data Security guidance.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("sigo_session");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

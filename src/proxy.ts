import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_TOKEN_PATTERN } from "@/lib/auth-config";

export function proxy(request: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }
  const path = request.nextUrl.pathname;
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  // Routing only: pages, actions and APIs also validate the database session.
  if (token && SESSION_TOKEN_PATTERN.test(token)) return NextResponse.next();
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

export const config = {
  matcher: [
    "/sign-in/:path*", "/sign-up/:path*", "/dashboard/:path*",
    "/settings/:path*", "/usage/:path*", "/skills/:path*", "/api/:path*",
  ],
};

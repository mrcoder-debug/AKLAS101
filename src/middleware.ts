// Edge-compatible middleware. Uses a dedicated NextAuth instance built from
// authConfig (edge-safe: JWT-only session populate, no Prisma).
// Do NOT import `auth` from "@/server/auth" here — that module calls Prisma.

import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that never need a session.
  if (
    pathname === "/" ||                              // landing page
    pathname === "/login" ||
    pathname.startsWith("/activate") ||              // invitation activation
    pathname.startsWith("/invitation-expired") ||
    pathname.startsWith("/certificates") ||          // shareable certificate links
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // All other paths require authentication.
  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

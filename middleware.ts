import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { canAccessAdminPath, DEFAULT_ROLE, getDefaultAdminPath, type UserRole } from "@/lib/permissions";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.JWT_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as UserRole | undefined) ?? DEFAULT_ROLE;

  if (!canAccessAdminPath(request.nextUrl.pathname, role)) {
    return NextResponse.redirect(new URL(getDefaultAdminPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

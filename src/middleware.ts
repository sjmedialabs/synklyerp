import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/login");
  const isSuperAdminRoute = nextUrl.pathname.startsWith("/superadmin");
  const isDashboardRoute = nextUrl.pathname.startsWith("/app");

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    if (role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin", nextUrl));
    }
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (isSuperAdminRoute && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

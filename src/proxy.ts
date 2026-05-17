import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");

  const isSuperAdminRoute = nextUrl.pathname.startsWith("/superadmin");
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding");
  const isAppRoute = nextUrl.pathname.startsWith("/app");

  if (!isLoggedIn && (isAppRoute || isSuperAdminRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && (nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/login"))) {
    if (role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin", nextUrl));
    }
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (isSuperAdminRoute && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (isAppRoute && role === "SUPERADMIN") {
    return NextResponse.redirect(new URL("/superadmin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

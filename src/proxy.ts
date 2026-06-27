import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveModuleForAppPath } from "@/lib/modules/path-access";
import { isPathAllowedWhenSubscriptionExpired } from "@/lib/platform/tenant-subscription-service";
import { isPublicPath } from "@/lib/navigation/public-routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  const isSuperAdminRoute = pathname.startsWith("/superadmin");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAppRoute = pathname.startsWith("/app");
  const isPublic = isPublicPath(pathname);

  if (!isLoggedIn && (isAppRoute || isSuperAdminRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (!isLoggedIn && isPublic) {
    return NextResponse.next();
  }

  if (isLoggedIn && (pathname === "/" || isAuthRoute)) {
    if (role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin", nextUrl));
    }
    const onboardingDone = req.auth?.user?.onboardingCompleted;
    return NextResponse.redirect(new URL(onboardingDone ? "/app" : "/onboarding/business-type", nextUrl));
  }

  const onboardingDone = req.auth?.user?.onboardingCompleted;
  if (isLoggedIn && role !== "SUPERADMIN" && isAppRoute && onboardingDone === false) {
    const waitingUrl = new URL("/onboarding?waiting=1", nextUrl);
    return NextResponse.redirect(
      role === "ADMIN" ? new URL("/onboarding/business-type", nextUrl) : waitingUrl
    );
  }

  if (isLoggedIn && isOnboardingRoute && onboardingDone === false && role !== "ADMIN" && role !== "SUPERADMIN") {
    if (!nextUrl.searchParams.get("waiting")) {
      return NextResponse.redirect(new URL("/onboarding?waiting=1", nextUrl));
    }
  }

  if (isLoggedIn && isOnboardingRoute && onboardingDone === true) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (isSuperAdminRoute && role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  if (isAppRoute && role === "SUPERADMIN") {
    return NextResponse.redirect(new URL("/superadmin", nextUrl));
  }

  if (isLoggedIn && isAppRoute && role !== "SUPERADMIN" && onboardingDone !== false) {
    const paymentRequired = req.auth?.user?.isPaymentRequired === true;
    if (paymentRequired && !isPathAllowedWhenSubscriptionExpired(pathname)) {
      const dest = new URL("/app", nextUrl);
      dest.searchParams.set("payment_required", "1");
      return NextResponse.redirect(dest);
    }

    const requiredModule = resolveModuleForAppPath(nextUrl.pathname);
    if (requiredModule) {
      const enabled = req.auth?.user?.enabledModules ?? [];
      if (!enabled.includes(requiredModule)) {
        const dest = new URL("/app/module-unavailable", nextUrl);
        dest.searchParams.set("module", requiredModule);
        return NextResponse.redirect(dest);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

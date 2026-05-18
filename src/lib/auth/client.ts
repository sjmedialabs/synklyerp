import { getSession, signOut } from "next-auth/react";

export async function bootstrapAuthSession(rememberMe: boolean) {
  try {
    const res = await fetch("/api/auth/session/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rememberMe }),
    });
    if (!res.ok) {
      console.warn("[auth] refresh token issue skipped:", res.status);
    }
  } catch {
    /* non-fatal — session cookie from NextAuth is enough */
  }
}

export async function completeAuthRedirect() {
  const session = await getSession();
  const target = session?.user?.role === "SUPERADMIN" ? "/superadmin" : "/app";
  if (session?.user?.onboardingCompleted === false && session?.user?.role !== "SUPERADMIN") {
    window.location.href = "/onboarding";
    return;
  }
  window.location.href = target;
}

export async function secureSignOut() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    /* continue sign-out */
  }
  await signOut({ callbackUrl: "/login" });
}

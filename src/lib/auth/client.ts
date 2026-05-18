import { getSession, signOut } from "next-auth/react";

export async function bootstrapAuthSession(rememberMe: boolean) {
  await fetch("/api/auth/session/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rememberMe }),
  });
}

export async function completeAuthRedirect() {
  const session = await getSession();
  const target = session?.user?.role === "SUPERADMIN" ? "/superadmin" : "/app";
  if (!session?.user?.onboardingCompleted && session?.user?.role !== "SUPERADMIN") {
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

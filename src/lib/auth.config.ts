import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.businessType = user.businessType;
        token.onboardingCompleted = user.onboardingCompleted;
        token.enabledModules = user.enabledModules;
        token.rememberMe = user.rememberMe === true;
        const maxAge = token.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      if (trigger === "update") {
        const maxAge = token.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
        if (token.tenantId) {
          const { getTenantSessionMeta } = await import("@/lib/tenant/session-meta");
          const meta = await getTenantSessionMeta(token.tenantId as string);
          token.onboardingCompleted = meta.onboardingCompleted;
          token.enabledModules = meta.enabledModules;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.tenantName = (token.tenantName as string | null) ?? null;
        session.user.businessType = (token.businessType as string | null) ?? null;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean | undefined;
        session.user.enabledModules = (token.enabledModules as string[] | undefined) ?? [];
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

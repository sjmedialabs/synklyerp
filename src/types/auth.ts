import type { DefaultSession } from "next-auth";

export type AppRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "USER" | "VIEWER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      tenantId?: string | null;
      tenantName?: string | null;
      businessType?: string | null;
      onboardingCompleted?: boolean;
      enabledModules?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    tenantId?: string | null;
    tenantName?: string | null;
    businessType?: string | null;
    onboardingCompleted?: boolean;
    enabledModules?: string[];
    rememberMe?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    rememberMe?: boolean;
  }
}

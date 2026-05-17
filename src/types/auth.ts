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
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    tenantId?: string | null;
    tenantName?: string | null;
    businessType?: string | null;
  }
}

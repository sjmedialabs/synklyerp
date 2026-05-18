import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/auth";

export type SessionContext = {
  userId: string;
  role: AppRole;
  tenantId: string | null;
  email: string;
};

export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return {
    userId: session.user.id,
    role: session.user.role,
    tenantId: session.user.tenantId ?? null,
    email: session.user.email ?? "",
  };
}

export async function requireTenantSession(): Promise<SessionContext & { tenantId: string }> {
  const ctx = await requireSession();
  if (ctx.role === "SUPERADMIN") {
    throw new Error("TENANT_REQUIRED");
  }
  if (!ctx.tenantId) {
    throw new Error("TENANT_REQUIRED");
  }
  return { ...ctx, tenantId: ctx.tenantId };
}

export async function requireSuperAdmin(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (ctx.role !== "SUPERADMIN") {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}

export async function resolveTenantId(ctx: SessionContext): Promise<string> {
  if (ctx.tenantId) return ctx.tenantId;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error("NO_TENANT");
  return (data as { id: string }).id;
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return { status: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }
    if (error.message === "FORBIDDEN") {
      return { status: 403, code: "FORBIDDEN", message: "Access denied" };
    }
    if (error.message === "TENANT_REQUIRED") {
      return { status: 403, code: "TENANT_REQUIRED", message: "Tenant context required" };
    }
    if (error.message === "NOT_FOUND") {
      return { status: 404, code: "NOT_FOUND", message: "Resource not found" };
    }
    if (error.message === "ONBOARDING_LOCKED") {
      return { status: 409, code: "ONBOARDING_LOCKED", message: "Onboarding configuration is locked" };
    }
    if (error.message === "MODULE_DISABLED") {
      return {
        status: 403,
        code: "MODULE_DISABLED",
        message: "This module is not enabled for your workspace",
      };
    }
  }
  return { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" };
}

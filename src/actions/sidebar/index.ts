"use server";

import { auth } from "@/lib/auth";
import { sidebarService } from "@/lib/sidebar/sidebar.service";
import { assignSidebarTemplate } from "@/repositories/sidebar/sidebar-templates";
import { upsertUserMenuPreferences, getUserMenuPreferences } from "@/repositories/sidebar/user-menu-preferences";
import {
  assignSidebarTemplateSchema,
  reorderMenusSchema,
  toggleFavoriteSchema,
  updateMenuVisibilitySchema,
} from "@/validators/sidebar";

export async function getSidebarAction() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("UNAUTHORIZED");

  return sidebarService.getSidebarForUser({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    enabledModules: session.user.enabledModules ?? [],
    businessType: session.user.businessType ?? null,
  });
}

export async function assignSidebarTemplateAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "ADMIN") throw new Error("FORBIDDEN");

  const body = assignSidebarTemplateSchema.parse(input);
  return assignSidebarTemplate(session.user.tenantId, body.templateId);
}

export async function updateMenuVisibilityAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "ADMIN") throw new Error("FORBIDDEN");

  const body = updateMenuVisibilitySchema.parse(input);
  const supabase = await import("@/lib/supabase/admin").then((m) => m.createAdminClient());
  const { error } = await supabase.from("tenant_sidebar_configs").upsert({
    tenant_id: session.user.tenantId,
    hidden_menu_slugs: body.hiddenMenuSlugs,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id" });
  if (error) throw error;
  return { success: true };
}

export async function reorderMenusAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "ADMIN") throw new Error("FORBIDDEN");

  const body = reorderMenusSchema.parse(input);
  const supabase = await import("@/lib/supabase/admin").then((m) => m.createAdminClient());
  const { error } = await supabase.from("tenant_sidebar_configs").upsert({
    tenant_id: session.user.tenantId,
    custom_order: body.customOrder,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id" });
  if (error) throw error;
  return { success: true };
}

export async function toggleFavoriteAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("UNAUTHORIZED");

  const body = toggleFavoriteSchema.parse(input);
  const prefs = await getUserMenuPreferences(session.user.tenantId, session.user.id);
  const favorites = new Set(prefs.favoriteMenuSlugs);
  if (body.favorite) favorites.add(body.menuSlug);
  else favorites.delete(body.menuSlug);

  await upsertUserMenuPreferences(session.user.tenantId, session.user.id, {
    favoriteMenuSlugs: [...favorites],
  });
  return { favoriteMenuSlugs: [...favorites] };
}

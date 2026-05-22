import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type UserMenuPreferences = {
  favoriteMenuSlugs: string[];
  recentPaths: { path: string; name: string; slug: string }[];
  pinnedSections: string[];
};

export async function getUserMenuPreferences(
  tenantId: string,
  userId: string
): Promise<UserMenuPreferences> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user_menu_preferences")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) return emptyPrefs();
      throw error;
    }
    if (!data) return emptyPrefs();

    const row = data as Record<string, unknown>;
    return {
      favoriteMenuSlugs: Array.isArray(row.favorite_menu_slugs) ? (row.favorite_menu_slugs as string[]) : [],
      recentPaths: Array.isArray(row.recent_paths)
        ? (row.recent_paths as { path: string; name: string; slug: string }[])
        : [],
      pinnedSections: Array.isArray(row.pinned_sections) ? (row.pinned_sections as string[]) : [],
    };
  } catch {
    return emptyPrefs();
  }
}

export async function upsertUserMenuPreferences(
  tenantId: string,
  userId: string,
  prefs: Partial<UserMenuPreferences>
) {
  const supabase = createAdminClient();
  const existing = await getUserMenuPreferences(tenantId, userId);
  const payload = {
    tenant_id: tenantId,
    user_id: userId,
    favorite_menu_slugs: prefs.favoriteMenuSlugs ?? existing.favoriteMenuSlugs,
    recent_paths: prefs.recentPaths ?? existing.recentPaths,
    pinned_sections: prefs.pinnedSections ?? existing.pinnedSections,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_menu_preferences")
    .upsert(payload, { onConflict: "tenant_id,user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function trackRecentMenuVisit(
  tenantId: string,
  userId: string,
  visit: { path: string; name: string; slug: string }
) {
  const prefs = await getUserMenuPreferences(tenantId, userId);
  const recent = [visit, ...prefs.recentPaths.filter((r) => r.path !== visit.path)].slice(0, 10);
  await upsertUserMenuPreferences(tenantId, userId, { recentPaths: recent });
}

function emptyPrefs(): UserMenuPreferences {
  return { favoriteMenuSlugs: [], recentPaths: [], pinnedSections: [] };
}

import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import { getModulePageDefinition } from "@/config/module-page-registry";

export type ModuleScopeItem = {
  id: string;
  itemKey: string;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
};

export async function listModuleScopeItems(
  tenantId: string,
  pagePath: string
): Promise<ModuleScopeItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_module_scope_items")
    .select("id, item_key, title, description, status, sort_order")
    .eq("tenant_id", tenantId)
    .eq("page_path", pagePath)
    .order("sort_order");

  if (error) {
    if (isMissingSchemaError(error)) {
      await seedFromRegistry(tenantId, pagePath);
      return [];
    }
    throw error;
  }

  if (!data?.length) {
    await seedFromRegistry(tenantId, pagePath);
    const { data: seeded, error: reErr } = await supabase
      .from("tenant_module_scope_items")
      .select("id, item_key, title, description, status, sort_order")
      .eq("tenant_id", tenantId)
      .eq("page_path", pagePath)
      .order("sort_order");
    if (reErr) throw reErr;
    return mapRows(seeded ?? []);
  }

  return mapRows(data);
}

async function seedFromRegistry(tenantId: string, pagePath: string) {
  const def = getModulePageDefinition(pagePath);
  if (!def?.scopeItems.length) return;

  const supabase = createAdminClient();
  const rows = def.scopeItems.map((item, index) => ({
    tenant_id: tenantId,
    page_path: pagePath,
    item_key: item.key,
    title: item.title,
    description: item.description ?? null,
    status: item.status ?? "planned",
    sort_order: index,
  }));

  const { error } = await supabase.from("tenant_module_scope_items").upsert(rows, {
    onConflict: "tenant_id,page_path,item_key",
  });
  if (error && !isMissingSchemaError(error)) throw error;
}

function mapRows(rows: Record<string, unknown>[]): ModuleScopeItem[] {
  return rows.map((r) => ({
    id: String(r.id),
    itemKey: String(r.item_key),
    title: String(r.title),
    description: (r.description as string | null) ?? null,
    status: String(r.status),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

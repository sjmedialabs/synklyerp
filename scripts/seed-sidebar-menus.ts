import { SIDEBAR_MENU_CATALOG, type MenuSeedNode } from "@/lib/sidebar/menu-seed-data";
import { createAdminClient } from "@/lib/supabase/admin";

async function seedNode(node: MenuSeedNode, parentId: string | null, sortOrder: number): Promise<string> {
  const supabase = createAdminClient();

  const payload = {
    parent_id: parentId,
    name: node.name,
    slug: node.slug,
    path: node.path ?? null,
    icon: node.icon ?? null,
    module_key: node.moduleKey ?? null,
    menu_type: node.menuType ?? (node.children?.length ? "group" : "item"),
    permission_module: node.permissionModule ?? null,
    permission_feature: node.permissionFeature ?? null,
    permission_action: "read",
    sort_order: node.sortOrder ?? sortOrder,
    required_plan: node.requiredPlan ?? null,
    required_business_types: node.requiredBusinessTypes ?? [],
    hidden_for_business_types: node.hiddenForBusinessTypes ?? [],
    required_submodules: node.requiredSubmodules ?? [],
    feature_flag_key: node.featureFlagKey ?? null,
    badge: node.badge ?? null,
    status: node.status ?? "built",
    is_visible: true,
    is_active: true,
  };

  const { data: existing } = await supabase
    .from("sidebar_menus")
    .select("id")
    .eq("slug", node.slug)
    .maybeSingle();

  let menuId: string;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("sidebar_menus")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    menuId = data.id as string;
  } else {
    const { data, error } = await supabase.from("sidebar_menus").insert(payload).select("id").single();
    if (error) throw error;
    menuId = data.id as string;
  }

  if (node.children?.length) {
    for (let i = 0; i < node.children.length; i++) {
      await seedNode(node.children[i], menuId, i);
    }
  }

  return menuId;
}

async function linkTemplateMenus() {
  const supabase = createAdminClient();
  const { data: menus } = await supabase.from("sidebar_menus").select("id, slug").is("deleted_at", null);
  const { data: templates } = await supabase.from("sidebar_templates").select("id, slug, business_type_id").is("deleted_at", null);

  if (!menus?.length || !templates?.length) return;

  const menuBySlug = new Map(menus.map((m) => [(m as { slug: string }).slug, (m as { id: string }).id]));

  for (const tpl of templates) {
    const templateId = (tpl as { id: string }).id;
    await supabase.from("sidebar_template_items").delete().eq("template_id", templateId);

    let order = 0;
    for (const root of SIDEBAR_MENU_CATALOG) {
      const menuId = menuBySlug.get(root.slug);
      if (!menuId) continue;
      await supabase.from("sidebar_template_items").upsert({
        template_id: templateId,
        menu_id: menuId,
        sort_order: order++,
        is_visible: true,
      }, { onConflict: "template_id,menu_id" });
    }
  }
}

async function main() {
  console.log("Seeding sidebar menus...");
  for (let i = 0; i < SIDEBAR_MENU_CATALOG.length; i++) {
    await seedNode(SIDEBAR_MENU_CATALOG[i], null, i * 10);
  }
  console.log("Linking template items...");
  await linkTemplateMenus();
  console.log("Sidebar seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

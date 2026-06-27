import { apiError, apiSuccess } from "@/lib/api/response";
import { buildFeatureTree, getEnabledMenuIdsForCategory, filterMenusByAssignment } from "@/lib/provisioning/category-feature-service";
import { buildFeatureTreeFromRecords, getAlwaysVisibleSlugsFromDb, listErpFeatures } from "@/lib/platform/erp-feature-service";
import { buildSidebarSections } from "@/lib/sidebar/menu-renderer.service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { listAllSidebarMenus } from "@/repositories/sidebar/sidebar-menus";

/** Preview sidebar for a business type (platform admin) */
export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(req.url);
    const businessTypeId = url.searchParams.get("businessTypeId");

    const [menus, alwaysVisibleSlugs] = await Promise.all([
      listAllSidebarMenus(),
      getAlwaysVisibleSlugsFromDb(),
    ]);

    if (!menus.length) {
      const features = await listErpFeatures(true);
      return apiSuccess({
        source: "features-master",
        tree: buildFeatureTreeFromRecords(features),
        sections: [],
      });
    }

    let filtered = menus;
    if (businessTypeId) {
      const assignedIds = await getEnabledMenuIdsForCategory(businessTypeId);
      if (assignedIds.size > 0) {
        filtered = filterMenusByAssignment(menus, assignedIds, alwaysVisibleSlugs);
      }
    }

    const ctx = {
      tenantId: "preview",
      userId: "preview",
      role: "ADMIN",
      businessType: null,
      businessTypeSlug: null,
      planSlug: "enterprise",
      enabledModules: ["HR", "Finance", "Sales", "Marketing", "Projects", "Operations"],
      enabledSubmodules: [],
      permissions: [],
      featureFlags: new Set<string>(),
      hiddenMenuSlugs: new Set<string>(),
      alwaysVisibleSlugs,
      orgMenuOverrides: new Map<string, "enable" | "disable">(),
      isAdmin: true,
    };

    const sections = buildSidebarSections(filtered, ctx);
    const tree = await buildFeatureTree();

    return apiSuccess({ source: "database", tree, sections, menuCount: filtered.length });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

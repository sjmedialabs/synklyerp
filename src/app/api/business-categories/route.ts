import { apiError, apiSuccess } from "@/lib/api/response";
import { getAssignedFeaturePreviewsByCategory } from "@/lib/provisioning/category-feature-service";
import { handleApiError } from "@/lib/tenant/context";
import { listBusinessTypesWithSubcategories } from "@/repositories/provisioning/business-types";

/**
 * Business categories (Product / Service / Hybrid) with assigned feature previews.
 * "Subcategories" in the product sense = menus/submenus assigned to each category by Platform Admin.
 */
export async function GET() {
  try {
    const [types, featurePreviews] = await Promise.all([
      listBusinessTypesWithSubcategories(),
      getAssignedFeaturePreviewsByCategory(),
    ]);

    const data = types.map((type) => ({
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description,
      legacyKey: type.legacyKey,
      icon: type.icon,
      color: type.color,
      themeColor: type.themeColor,
      sortOrder: type.sortOrder,
      /** Assigned ERP features (menus/submenus) for this category */
      featurePreviews: featurePreviews[type.id] ?? [],
      /** @deprecated industry labels — use featurePreviews */
      subcategories: (featurePreviews[type.id] ?? []).map((f, i) => ({
        id: `${type.id}-feature-${i}`,
        name: f.name,
        slug: f.slug,
        icon: f.icon,
        description: null,
      })),
    }));

    return apiSuccess(data);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

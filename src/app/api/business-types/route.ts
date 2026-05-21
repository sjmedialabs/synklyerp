import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { listBusinessTypesWithSubcategories } from "@/repositories/provisioning/business-types";

export async function GET() {
  try {
    const types = await listBusinessTypesWithSubcategories();
    const data = types.map((type) => ({
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description,
      legacyKey: type.legacyKey,
      subcategories: type.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        legacyKey: sub.legacyKey,
      })),
      defaultModules: type.defaultConfig.erpModules,
      defaultSubmodules: type.defaultConfig.erpSubmodules,
    }));
    return apiSuccess(data);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

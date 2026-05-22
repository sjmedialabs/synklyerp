import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getBusinessTypeById, listBusinessTypesWithSubcategories } from "@/repositories/provisioning/business-types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get("typeId");

    if (typeId) {
      const type = await getBusinessTypeById(typeId);
      if (!type) return apiError("Business type not found", 404, "NOT_FOUND");
      return apiSuccess(
        type.subcategories.map((sub) => ({
          id: sub.id,
          businessTypeId: sub.businessTypeId,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          legacyKey: sub.legacyKey,
          icon: sub.icon,
          sortOrder: sub.sortOrder,
          enabledModules: sub.enabledModules,
        }))
      );
    }

    const types = await listBusinessTypesWithSubcategories();
    const categories = types.flatMap((type) =>
      type.subcategories.map((sub) => ({
        id: sub.id,
        businessTypeId: type.id,
        businessTypeName: type.name,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        legacyKey: sub.legacyKey,
        icon: sub.icon,
        sortOrder: sub.sortOrder,
        enabledModules: sub.enabledModules,
      }))
    );
    return apiSuccess(categories);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

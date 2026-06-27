import { apiError, apiSuccess } from "@/lib/api/response";
import { listErpFeatures } from "@/lib/platform/erp-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";

export async function GET() {
  try {
    await requireSuperAdmin();
    const features = await listErpFeatures(true);
    const data = features.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      icon: m.icon,
      menuType: m.menuType,
      moduleKey: m.moduleKey,
      parentId: m.parentId,
      sortOrder: m.sortOrder,
    }));
    return apiSuccess(data);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

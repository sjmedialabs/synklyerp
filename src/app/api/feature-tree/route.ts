import { apiError, apiSuccess } from "@/lib/api/response";
import { buildFeatureTreeFromRecords, listErpFeatures } from "@/lib/platform/erp-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";

export async function GET() {
  try {
    await requireSuperAdmin();
    const features = await listErpFeatures(true);
    return apiSuccess(buildFeatureTreeFromRecords(features));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

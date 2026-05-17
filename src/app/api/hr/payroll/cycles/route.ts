import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession } from "@/lib/tenant/context";

export async function GET() {
  try {
    await requireTenantSession();
    return apiSuccess([]);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

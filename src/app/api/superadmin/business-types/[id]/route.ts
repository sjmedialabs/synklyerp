import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as repo from "@/repositories/superadmin/business-masters";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    await repo.softDeleteBusinessType(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

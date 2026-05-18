import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSession } from "@/lib/tenant/context";
import * as repo from "@/repositories/enterprise/notifications";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ctx = await requireSession();
    const { id } = await params;
    return apiSuccess(await repo.markNotificationRead(ctx.userId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

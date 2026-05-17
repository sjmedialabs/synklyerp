import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSession } from "@/lib/tenant/context";
import * as repo from "@/repositories/enterprise/notifications";

export async function POST() {
  try {
    const ctx = await requireSession();
    return apiSuccess(await repo.markAllNotificationsRead(ctx.userId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

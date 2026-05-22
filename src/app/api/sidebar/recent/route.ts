import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import { trackRecentMenuVisit } from "@/repositories/sidebar/user-menu-preferences";
import { trackRecentSchema } from "@/validators/sidebar";

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const body = trackRecentSchema.parse(await req.json());
    await trackRecentMenuVisit(tenantId, ctx.userId, body);
    return apiSuccess({ tracked: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

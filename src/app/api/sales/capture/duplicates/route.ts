import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listDuplicateQueue, resolveDuplicate } from "@/repositories/sales/crm/duplicates";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const status = new URL(req.url).searchParams.get("status") ?? "pending";
    return apiSuccess(await listDuplicateQueue(tenantId, status));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.update, { req });
    const body = z
      .object({ id: z.string().uuid(), status: z.enum(["merged", "ignored", "created"]) })
      .parse(await req.json());
    return apiSuccess(await resolveDuplicate(ctx.tenantId, body.id, body.status, ctx.userId));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

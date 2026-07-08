import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listLeadActivities, logLeadActivity } from "@/repositories/sales/crm/lead-attribution";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const { id } = await params;
    return apiSuccess(await listLeadActivities(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const body = z.object({ note: z.string().min(1) }).parse(await req.json());
    const activity = await logLeadActivity({
      tenantId: ctx.tenantId,
      leadId: id,
      activityType: "note",
      title: "Note added",
      description: body.note,
      actorId: ctx.userId,
    });
    return apiSuccess(activity);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

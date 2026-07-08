import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { logLeadEngagement, getLeadEngagementSummary } from "@/repositories/sales/crm/engagement";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const { id } = await params;
    return apiSuccess(await getLeadEngagementSummary(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.update, { req });
    const { id } = await params;
    const body = z
      .object({
        channel: z.enum(["call", "sms", "email", "whatsapp"]),
        action: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(await req.json());

    const row = await logLeadEngagement({
      tenantId: ctx.tenantId,
      leadId: id,
      userId: ctx.userId,
      channel: body.channel,
      action: body.action,
      metadata: body.metadata,
    });
    return apiSuccess(row);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

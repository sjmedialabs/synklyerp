import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { mapDograhStatusToLead } from "@/lib/sales/dograh";
import { verifyDograhRequest } from "@/lib/sales/dograh-auth";
import { logLeadActivity } from "@/repositories/sales/crm/lead-attribution";
import * as leadsRepo from "@/repositories/sales/leads";
import { dograhUpdateStatusSchema } from "@/validators/dograh";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = dograhUpdateStatusSchema.parse(await req.json());

    if (!(await verifyDograhRequest(req, body.tenantId))) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!body.tenantId) {
      return apiError("tenantId is required", 400, "TENANT_REQUIRED");
    }

    const mappedStatus = mapDograhStatusToLead(body.status);
    const patch: Record<string, unknown> = {};
    if (mappedStatus) patch.status = mappedStatus;
    if (body.summary) patch.aiSummary = body.summary;

    if (Object.keys(patch).length > 0) {
      await leadsRepo.updateLead(body.tenantId, body.leadId, patch);
    }

    await logLeadActivity({
      tenantId: body.tenantId,
      leadId: body.leadId,
      activityType: "ai_call",
      title: "AI call status update",
      description: body.summary,
      metadata: { status: body.status },
    });

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

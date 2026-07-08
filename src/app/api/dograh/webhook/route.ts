import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyDograhRequest } from "@/lib/sales/dograh-auth";
import { applyDograhWebhookResult, findLeadByPhone } from "@/repositories/sales/crm/calls";
import { dograhWebhookSchema } from "@/validators/dograh";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = dograhWebhookSchema.parse(await req.json());

    if (!(await verifyDograhRequest(req, body.tenantId))) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!body.tenantId) {
      return apiError("tenantId is required in webhook payload", 400, "TENANT_REQUIRED");
    }

    const lead = await findLeadByPhone(body.tenantId, body.phone, body.leadId);
    if (!lead) return apiError("Lead not found for phone", 404, "NOT_FOUND");

    const callLog = await applyDograhWebhookResult({
      tenantId: body.tenantId,
      leadId: lead.id,
      phone: body.phone,
      callId: body.callId ?? null,
      status: body.status ?? null,
      summary: body.summary ?? null,
      transcript: body.transcript ?? null,
      duration: body.duration ?? null,
      recording: body.recording ?? null,
      visitDate: body.visitDate ?? null,
    });

    return apiSuccess({ ok: true, callLogId: callLog.id, leadId: lead.id });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    if (error instanceof Error && error.message === "SCHEMA_NOT_MIGRATED") {
      return apiError(
        "Database migration 025 is required. Apply supabase/migrations/025_crm_dograh_calls.sql",
        503,
        "SCHEMA_NOT_MIGRATED"
      );
    }
    if (error instanceof Error) {
      return apiError(error.message, 400, "WEBHOOK_ERROR");
    }
    return apiError("Webhook processing failed", 500, "INTERNAL_ERROR");
  }
}

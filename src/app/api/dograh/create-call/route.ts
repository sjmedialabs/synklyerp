import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { buildDograhCustomerContext, createDograhCall, isDograhConfigured } from "@/lib/sales/dograh";
import { parseWhatsAppPhone } from "@/lib/sales/whatsapp-phone";
import { logLeadEngagement } from "@/repositories/sales/crm/engagement";
import { getLatestCallLogForLead } from "@/repositories/sales/crm/calls";
import { resolveDograhCredentials } from "@/repositories/sales/crm/dograh-config";
import * as leadsRepo from "@/repositories/sales/leads";
import { dograhCreateCallSchema } from "@/validators/dograh";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.update, { req });
    const body = dograhCreateCallSchema.parse(await req.json());

    if (!(await isDograhConfigured(ctx.tenantId))) {
      return apiError(
        "Dograh AI Voice is not active. Configure it under Organisation Setup → Dograh AI Voice.",
        503,
        "DOGRAH_NOT_CONFIGURED"
      );
    }

    const lead = await leadsRepo.getLead(ctx.tenantId, body.leadId);
    if (!lead.phone) return apiError("Lead has no phone number", 400, "NO_PHONE");

    const parsed = parseWhatsAppPhone(lead.phone);
    if (!parsed.valid) {
      return apiError(parsed.error ?? "Invalid phone number", 400, "INVALID_PHONE");
    }

    const creds = await resolveDograhCredentials(ctx.tenantId);
    if (!creds?.publicAppUrl) {
      return apiError(
        "Public app URL is not configured. Set it on the Dograh setup page or in DOGRAH_APP_PUBLIC_URL.",
        503,
        "PUBLIC_URL_MISSING"
      );
    }

    const lastCall = await getLatestCallLogForLead(ctx.tenantId, lead.id);
    const initialContext = buildDograhCustomerContext(lead, lastCall?.summary);

    const result = await createDograhCall({
      tenantId: ctx.tenantId,
      phoneE164: parsed.normalized,
      leadId: lead.id,
      initialContext,
      telephonyConfigurationId: creds.telephonyConfigurationId,
    });

    await logLeadEngagement({
      tenantId: ctx.tenantId,
      leadId: lead.id,
      userId: ctx.userId,
      channel: "call",
      action: "ai_call_started",
      metadata: {
        externalCallId: result.callId,
        workflowRunId: result.workflowRunId,
      },
    });

    return apiSuccess({
      callId: result.callId,
      workflowRunId: result.workflowRunId,
      phone: parsed.display,
      leadId: lead.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    if (error instanceof Error) {
      const err = handleApiError(error);
      if (err.code === "INTERNAL_ERROR") {
        return apiError(error.message, 400, "DOGRAH_ERROR");
      }
      return apiError(err.message, err.status, err.code);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

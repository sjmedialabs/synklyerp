import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import {
  getOrCreateConversation,
  listMessages,
  sendWhatsAppMessage,
  summarizeConversation,
  getWhatsAppConfig,
  validateWhatsAppNumber,
} from "@/repositories/sales/crm/whatsapp";
import { logLeadEngagement } from "@/repositories/sales/crm/engagement";
import * as leadsRepo from "@/repositories/sales/leads";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const { id } = await params;
    const lead = await leadsRepo.getLead(tenantId, id);
    if (!lead.phone) return apiError("Lead has no phone number", 400, "NO_PHONE");

    const conversation = await getOrCreateConversation(tenantId, id, lead.phone);
    const messages = await listMessages(tenantId, conversation.id);
    const config = await getWhatsAppConfig(tenantId);

    return apiSuccess({ conversation, messages, config });
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
        message: z.string().min(1).optional(),
        action: z.enum(["send", "summarize", "validate"]).optional(),
        phone: z.string().optional(),
      })
      .parse(await req.json());

    const lead = await leadsRepo.getLead(ctx.tenantId, id);
    const phone = body.phone ?? lead.phone;
    if (!phone) return apiError("Lead has no phone number", 400, "NO_PHONE");

    if (body.action === "validate") {
      const result = await validateWhatsAppNumber(ctx.tenantId, phone);
      if (!result.valid || !result.onWhatsApp) {
        return apiError(result.message, 400, "INVALID_WHATSAPP_NUMBER", result);
      }
      return apiSuccess(result);
    }

    const conversation = await getOrCreateConversation(ctx.tenantId, id, phone);

    if (body.action === "summarize") {
      const summary = await summarizeConversation(ctx.tenantId, conversation.id);
      return apiSuccess({ summary });
    }

    if (!body.message) return apiError("Message required", 400, "VALIDATION_ERROR");

    const msg = await sendWhatsAppMessage({
      tenantId: ctx.tenantId,
      conversationId: conversation.id,
      leadId: id,
      phone,
      body: body.message,
      senderType: "human",
      userId: ctx.userId,
    });

    await logLeadEngagement({
      tenantId: ctx.tenantId,
      leadId: id,
      userId: ctx.userId,
      channel: "whatsapp",
      action: "message_sent",
    });

    return apiSuccess(msg);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    if (error instanceof Error) {
      const err = handleApiError(error);
      if (err.code === "INTERNAL_ERROR") {
        return apiError(error.message, 400, "WHATSAPP_ERROR");
      }
      return apiError(err.message, err.status, err.code);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

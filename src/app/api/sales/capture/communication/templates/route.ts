import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createTemplate, listTemplates, seedDefaultTemplates } from "@/repositories/sales/crm/communication";
import { crmMessageTemplateSchema } from "@/validators/crm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    if (url.searchParams.get("seed") === "1") await seedDefaultTemplates(ctx.tenantId, ctx.userId);
    const channel = url.searchParams.get("channel") ?? undefined;
    return apiSuccess(await listTemplates(ctx.tenantId, channel));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.create, { req });
    const body = crmMessageTemplateSchema.parse(await req.json());
    return apiSuccess(await createTemplate(ctx.tenantId, ctx.userId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

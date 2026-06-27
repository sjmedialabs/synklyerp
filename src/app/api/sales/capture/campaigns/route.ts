import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createCampaign, listCampaigns } from "@/repositories/sales/crm/campaigns";
import { crmCampaignSchema } from "@/validators/crm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    return apiSuccess(await listCampaigns(tenantId));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.create, { req });
    const body = crmCampaignSchema.parse(await req.json());
    return apiSuccess(await createCampaign(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

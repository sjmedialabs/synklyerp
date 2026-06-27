import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { ingestLead } from "@/lib/crm/lead-ingestion-service";
import * as repo from "@/repositories/sales/leads";
import { leadSchema } from "@/validators/sales";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const status = url.searchParams.get("status") ?? undefined;
    const result = await repo.listLeads(tenantId, { ...params, status });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.create, { req });
    const body = leadSchema.parse(await req.json());
    const lead = await ingestLead(ctx.tenantId, {
      name: body.name,
      company: body.company,
      phone: body.phone,
      email: body.email,
      leadType: body.leadType,
      serviceId: body.serviceId,
      source: body.source,
      notes: body.notes,
      leadSourceId: body.crmLeadSourceId,
      originalSource: body.originalSource ?? body.source,
      attribution: body.attribution,
      actorId: ctx.userId,
      ingestChannel: "manual",
    });
    return apiSuccess(lead, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

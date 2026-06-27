import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { createForm, listForms } from "@/repositories/sales/crm/forms-webhooks";
import { seedDefaultFormFields } from "@/repositories/sales/crm/forms-extended";
import { crmFormSchema } from "@/validators/crm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const result = await listForms(tenantId, params);
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.sales.leads.create, { req });
    const body = crmFormSchema.parse(await req.json());
    const form = await createForm(ctx.tenantId, ctx.userId, body);
    await seedDefaultFormFields(ctx.tenantId, form.id);
    return apiSuccess(form, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

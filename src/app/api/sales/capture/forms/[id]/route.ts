import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getFormById, updateForm, listFormFields, replaceFormFields } from "@/repositories/sales/crm/forms-extended";
import { crmFormSchema, crmFormFieldSchema } from "@/validators/crm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read);
    const { id } = await params;
    const form = await getFormById(tenantId, id);
    const fields = await listFormFields(tenantId, id);
    return apiSuccess({ form, fields });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update);
    const { id } = await params;
    const body = crmFormSchema.partial().parse(await req.json());
    return apiSuccess(await updateForm(tenantId, id, body));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

const fieldsSchema = z.object({ fields: z.array(crmFormFieldSchema) });

export async function PUT(req: Request, { params }: Params) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update);
    const { id } = await params;
    const { fields } = fieldsSchema.parse(await req.json());
    return apiSuccess(await replaceFormFields(tenantId, id, fields));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

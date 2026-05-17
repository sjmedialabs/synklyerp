import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/hr/employees";
import { employeeSchema } from "@/validators/hr";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    return apiSuccess(await repo.getEmployee(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    return apiSuccess(await repo.updateEmployee(tenantId, id, employeeSchema.partial().parse(await req.json())));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    return apiSuccess(await repo.deleteEmployee(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

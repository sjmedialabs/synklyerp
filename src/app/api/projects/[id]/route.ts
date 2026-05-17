import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/projects";
import { projectSchema } from "@/validators/projects";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const { id } = await params;
    return apiSuccess(await repo.getProject(tenantId, id));
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
    return apiSuccess(await repo.updateProject(tenantId, id, projectSchema.partial().parse(await req.json())));
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
    return apiSuccess(await repo.deleteProject(tenantId, id));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as plansRepo from "@/repositories/platform/plans";
import { planSchema } from "@/validators/platform";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = planSchema.parse({ ...(await req.json()), id });
    const plan = await plansRepo.upsertPlan({ ...body, id });
    return apiSuccess(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const result = await plansRepo.deletePlan(id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

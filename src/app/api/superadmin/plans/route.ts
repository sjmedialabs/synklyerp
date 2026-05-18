import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as plansRepo from "@/repositories/platform/plans";
import { planSchema } from "@/validators/platform";

export async function GET() {
  try {
    await requireSuperAdmin();
    const plans = await plansRepo.listAllPlans();
    return apiSuccess(plans);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = planSchema.parse(await req.json());
    const plan = await plansRepo.upsertPlan(body);
    return apiSuccess(plan, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

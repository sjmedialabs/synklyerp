import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as repo from "@/repositories/superadmin/business-masters";
import { businessTypeMasterSchema } from "@/validators/business-masters";

export async function GET() {
  try {
    await requireSuperAdmin();
    const types = await repo.listBusinessTypesAdmin();
    return apiSuccess(types);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = businessTypeMasterSchema.parse(await req.json());
    const type = await repo.upsertBusinessType(body);
    return apiSuccess(type, undefined, body.id ? 200 : 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

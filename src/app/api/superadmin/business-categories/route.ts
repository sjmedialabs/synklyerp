import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as repo from "@/repositories/superadmin/business-masters";
import { businessCategoryMasterSchema } from "@/validators/business-masters";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const typeId = new URL(req.url).searchParams.get("typeId") ?? undefined;
    const categories = await repo.listBusinessCategoriesAdmin(typeId ?? undefined);
    return apiSuccess(categories);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = businessCategoryMasterSchema.parse(await req.json());
    const category = await repo.upsertBusinessCategory(body);
    return apiSuccess(category, undefined, body.id ? 200 : 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

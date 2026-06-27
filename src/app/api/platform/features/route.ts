import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  buildFeatureTreeFromRecords,
  createErpFeature,
  listErpFeatures,
} from "@/lib/platform/erp-feature-service";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { erpFeatureSchema } from "@/validators/platform-features";

export async function GET() {
  try {
    await requireSuperAdmin();
    const features = await listErpFeatures(true);
    return apiSuccess({ features, tree: buildFeatureTreeFromRecords(features) });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const body = erpFeatureSchema.parse(await req.json());
    const feature = await createErpFeature(body, ctx.userId);
    return apiSuccess(feature, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

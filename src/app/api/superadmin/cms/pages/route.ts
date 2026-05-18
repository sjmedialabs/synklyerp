import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as cmsRepo from "@/repositories/platform/cms-pages";
import { cmsPageSchema } from "@/validators/platform";

export async function GET() {
  try {
    await requireSuperAdmin();
    const pages = await cmsRepo.listCmsPages();
    return apiSuccess(pages);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const body = cmsPageSchema.parse(await req.json());
    const page = await cmsRepo.upsertCmsPage({
      ...body,
      ogImageUrl: body.ogImageUrl || undefined,
    });
    return apiSuccess(page, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

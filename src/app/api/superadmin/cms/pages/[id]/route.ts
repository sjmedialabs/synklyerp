import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import * as cmsRepo from "@/repositories/platform/cms-pages";
import { cmsPageSchema } from "@/validators/platform";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const page = await cmsRepo.getCmsPageById(id);
    if (!page) return apiError("Page not found", 404);
    return apiSuccess(page);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = cmsPageSchema.parse({ ...(await req.json()), id });
    const page = await cmsRepo.upsertCmsPage({
      ...body,
      id,
      ogImageUrl: body.ogImageUrl || undefined,
    });
    return apiSuccess(page);
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
    const result = await cmsRepo.deleteCmsPage(id);
    return apiSuccess(result);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

import { apiError, apiSuccess } from "@/lib/api/response";
import * as cmsRepo from "@/repositories/platform/cms-pages";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const page = await cmsRepo.getCmsPageBySlug(slug, true);
    if (!page) return apiError("Page not found", 404, "NOT_FOUND");
    return apiSuccess(page);
  } catch (error) {
    console.error(error);
    return apiError("Failed to load page", 500);
  }
}

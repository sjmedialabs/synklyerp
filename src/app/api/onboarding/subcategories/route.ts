import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { listSpecializationsByCategory } from "@/repositories/provisioning/business-specializations";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return apiError("categoryId query parameter is required", 400, "VALIDATION_ERROR");
    }

    const specializations = await listSpecializationsByCategory(categoryId);
    return apiSuccess(
      specializations.map((s) => ({
        id: s.id,
        businessSubcategoryId: s.businessSubcategoryId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        sortOrder: s.sortOrder,
        defaultModules: s.defaultModules,
        enabledReports: s.enabledReports,
        onboardingFormSchema: s.onboardingFormSchema,
      }))
    );
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

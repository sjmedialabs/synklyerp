import { apiError, apiSuccess } from "@/lib/api/response";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listActiveModules } from "@/repositories/tenant/modules";
import { getSubcategoryById } from "@/repositories/provisioning/business-types";
import { getTenantBusinessProfile } from "@/repositories/provisioning/tenant-business-profile";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.read, { req });
    const profile = await getTenantBusinessProfile(tenantId);
    const view = await businessProvisioningService.getTenantProvisioningView(tenantId);
    const enabledModules = await listActiveModules(tenantId);

    let businessType = null;
    let businessSubcategory = null;
    if (profile) {
      const match = await getSubcategoryById(profile.businessSubcategoryId);
      businessType = match?.type ?? null;
      businessSubcategory = match?.subcategory ?? null;
    }

    return apiSuccess({
      profile,
      businessType,
      businessSubcategory,
      enabledModules,
      enabledSubmodules: view.submodules,
      dashboardConfig: view.dashboards,
      workflows: view.workflows,
      provisioningStatus: profile?.provisioningStatus ?? "pending",
      onboardingCompleted: profile?.onboardingCompleted ?? false,
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

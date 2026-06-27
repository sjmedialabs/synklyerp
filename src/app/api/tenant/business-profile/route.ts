import { apiError, apiSuccess } from "@/lib/api/response";
import { businessProvisioningService } from "@/lib/provisioning/business-provisioning-service";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { listActiveModules } from "@/repositories/tenant/modules";
import { getSubcategoryById, getBusinessTypeById } from "@/repositories/provisioning/business-types";
import { getTenantBusinessProfile } from "@/repositories/provisioning/tenant-business-profile";
import { listTenantEnabledSubmoduleCodes } from "@/repositories/provisioning/tenant-enabled-modules";
import { resolveFeatureLinks, resolveBusinessTypeModuleLinks } from "@/lib/provisioning/feature-link-resolver";
import * as onboardingRepo from "@/repositories/tenant/onboarding";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.onboarding.read, { req });
    const profile = await getTenantBusinessProfile(tenantId);
    const view = await businessProvisioningService.getTenantProvisioningView(tenantId);
    const enabledModules = await listActiveModules(tenantId);
    const enabledSubmodules = view.submodules.length
      ? view.submodules
      : await listTenantEnabledSubmoduleCodes(tenantId);

    let moduleCodes = enabledModules;
    let submoduleCodes = enabledSubmodules;
    if (!moduleCodes.length || !submoduleCodes.length) {
      const onboarding = await onboardingRepo.getOnboardingState(tenantId);
      if (!moduleCodes.length) {
        moduleCodes =
          onboarding.enabledModules.length > 0
            ? onboarding.enabledModules
            : onboarding.previewModules;
      }
      if (!submoduleCodes.length) {
        submoduleCodes =
          onboarding.enabledSubmodules.length > 0
            ? onboarding.enabledSubmodules
            : onboarding.previewSubmodules;
      }
    }

    const { moduleLinks: tenantModuleLinks, capabilityLinks } = await resolveFeatureLinks(
      moduleCodes,
      submoduleCodes
    );

    let businessType = null;
    let businessSubcategory = null;
    let activeBusinessCategory: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      icon: string | null;
      legacyKey: string | null;
    } | null = null;
    let moduleLinks = tenantModuleLinks;

    if (profile?.businessTypeId) {
      const typeRow = await getBusinessTypeById(profile.businessTypeId);
      if (typeRow) {
        activeBusinessCategory = {
          id: typeRow.id,
          name: typeRow.name,
          slug: typeRow.slug,
          description: typeRow.description,
          icon: typeRow.icon,
          legacyKey: typeRow.legacyKey,
        };
        const categoryModules = await resolveBusinessTypeModuleLinks(profile.businessTypeId);
        if (categoryModules.length) moduleLinks = categoryModules;
      }
    }

    if (profile) {
      const match = await getSubcategoryById(profile.businessSubcategoryId);
      businessType = match?.type ?? null;
      businessSubcategory = match?.subcategory ?? null;
      if (!activeBusinessCategory && match?.type) {
        activeBusinessCategory = {
          id: match.type.id,
          name: match.type.name,
          slug: match.type.slug,
          description: match.type.description,
          icon: match.type.icon,
          legacyKey: match.type.legacyKey,
        };
        const categoryModules = await resolveBusinessTypeModuleLinks(match.type.id);
        if (categoryModules.length) moduleLinks = categoryModules;
      }
    }

    return apiSuccess({
      profile,
      businessType,
      businessSubcategory,
      activeBusinessCategory,
      enabledModules: moduleCodes,
      enabledSubmodules: submoduleCodes,
      moduleLinks,
      capabilityLinks,
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

import { resolveBusinessConfig, getBusinessConfigByLegacyKey } from "@/business-configs";
import type { ResolvedBusinessConfig } from "@/business-configs/types";
import type { ErpModuleKey } from "@/constants/onboarding";
import { writeActivityLog } from "@/repositories/enterprise/activity";
import {
  getSubcategoryById,
  resolveByLegacyKeys,
} from "@/repositories/provisioning/business-types";
import {
  getTenantBusinessProfile,
  updateProvisioningStatus,
  upsertTenantBusinessProfile,
} from "@/repositories/provisioning/tenant-business-profile";
import { listTenantDashboardConfigs, replaceTenantDashboardConfigs } from "@/repositories/provisioning/tenant-dashboard-configs";
import {
  listTenantEnabledModules,
  listTenantEnabledSubmoduleCodes,
  replaceTenantEnabledModules,
} from "@/repositories/provisioning/tenant-enabled-modules";
import { listTenantWorkflowTemplates, replaceTenantWorkflowTemplates } from "@/repositories/provisioning/tenant-workflow-templates";
import { activateModules } from "@/repositories/tenant/modules";
import { syncRolePermissionsForTenant } from "@/lib/rbac/sync-tenant-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";
import type { OnboardingDraftInput } from "@/validators/onboarding";

export type ProvisioningPreview = {
  erpModules: ErpModuleKey[];
  erpSubmodules: string[];
  dashboards: ResolvedBusinessConfig["dashboards"];
  workflows: ResolvedBusinessConfig["workflows"];
  roleTemplates: ResolvedBusinessConfig["roleTemplates"];
  reports: ResolvedBusinessConfig["reports"];
  navigation: ResolvedBusinessConfig["navigation"];
  branchDefaults: ResolvedBusinessConfig["branchDefaults"];
};

export type ProvisioningResult = {
  completedAt: string;
  enabledModules: ErpModuleKey[];
  enabledSubmodules: string[];
  provisioningStatus: string;
  profileId: string | null;
};

export class BusinessProvisioningService {
  async previewByIds(businessTypeId: string, businessSubcategoryId: string): Promise<ProvisioningPreview> {
    const resolved = await this.resolveConfigByIds(businessTypeId, businessSubcategoryId);
    return this.toPreview(resolved);
  }

  async previewByLegacyDraft(draft: Pick<OnboardingDraftInput, "businessType" | "industrySubtype">) {
    try {
      const match = await resolveByLegacyKeys(draft.businessType, draft.industrySubtype);
      if (match) {
        const config = resolveBusinessConfig(
          match.type.slug,
          match.subcategory.slug,
          match.subcategory.legacyKey ?? undefined
        );
        return this.toPreview(config);
      }
    } catch {
      /* fall back to static config when provisioning tables are unavailable */
    }

    const base = getBusinessConfigByLegacyKey(draft.businessType);
    if (!base) throw new Error("INVALID_BUSINESS_CONFIG");
    return this.toPreview(resolveBusinessConfig(base.slug, undefined, draft.industrySubtype));
  }

  async provisionTenant(input: {
    tenantId: string;
    userId: string;
    businessTypeId: string;
    businessSubcategoryId: string;
    draft?: OnboardingDraftInput;
    skipLegacyTenantUpdate?: boolean;
  }): Promise<ProvisioningResult> {
    const existing = await getTenantBusinessProfile(input.tenantId);
    if (existing?.onboardingCompleted) {
      throw new Error("ONBOARDING_LOCKED");
    }

    const resolved = await this.resolveConfigByIds(input.businessTypeId, input.businessSubcategoryId);
    const now = new Date().toISOString();
    const metadata = {
      roleTemplates: resolved.roleTemplates,
      branchDefaults: resolved.branchDefaults,
      reports: resolved.reports,
      navigation: resolved.navigation,
    };

    await upsertTenantBusinessProfile({
      tenantId: input.tenantId,
      businessTypeId: input.businessTypeId,
      businessSubcategoryId: input.businessSubcategoryId,
      provisioningStatus: "in_progress",
      confirmedBy: input.userId,
      provisioningMetadata: metadata,
    });

    try {
      await replaceTenantEnabledModules(input.tenantId, resolved.enabledModuleRows, input.userId);
      await replaceTenantDashboardConfigs(input.tenantId, resolved.dashboards);
      await replaceTenantWorkflowTemplates(input.tenantId, resolved.workflows);
      await activateModules(input.tenantId, resolved.erpModules);
      await syncRolePermissionsForTenant(input.tenantId, resolved.erpModules);

      if (!input.skipLegacyTenantUpdate) {
        await this.syncLegacyTenantFields(input.tenantId, resolved, input.draft, now);
      }

      const profile = await upsertTenantBusinessProfile({
        tenantId: input.tenantId,
        businessTypeId: input.businessTypeId,
        businessSubcategoryId: input.businessSubcategoryId,
        provisioningStatus: "completed",
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        confirmedBy: input.userId,
        provisioningMetadata: metadata,
      });

      await this.audit(input.tenantId, input.userId, "provision_complete", {
        businessTypeId: input.businessTypeId,
        businessSubcategoryId: input.businessSubcategoryId,
        modules: resolved.erpModules,
        submodules: resolved.erpSubmodules,
      });

      return {
        completedAt: now,
        enabledModules: resolved.erpModules,
        enabledSubmodules: resolved.erpSubmodules,
        provisioningStatus: "completed",
        profileId: profile.id,
      };
    } catch (error) {
      await updateProvisioningStatus(input.tenantId, "failed", {
        error: error instanceof Error ? error.message : "Provisioning failed",
      });
      throw error;
    }
  }

  async provisionTenantFromLegacyDraft(tenantId: string, userId: string, draft: OnboardingDraftInput) {
    const match = await resolveByLegacyKeys(draft.businessType, draft.industrySubtype);
    if (!match) {
      throw new Error("INVALID_BUSINESS_CONFIG");
    }
    return this.provisionTenant({
      tenantId,
      userId,
      businessTypeId: match.type.id,
      businessSubcategoryId: match.subcategory.id,
      draft,
    });
  }

  async reprovisionTenant(input: {
    tenantId: string;
    userId: string;
    businessTypeId: string;
    businessSubcategoryId: string;
    reason: string;
  }) {
    const supabase = createAdminClient();
    await supabase
      .from("tenants")
      .update({
        onboarding_locked: false,
        onboarding_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.tenantId);

    await supabase
      .from("tenant_business_profiles")
      .update({
        onboarding_completed: false,
        onboarding_completed_at: null,
        provisioning_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", input.tenantId);

    const result = await this.provisionTenant({
      tenantId: input.tenantId,
      userId: input.userId,
      businessTypeId: input.businessTypeId,
      businessSubcategoryId: input.businessSubcategoryId,
    });

    await this.audit(input.tenantId, input.userId, "reprovision", { reason: input.reason, ...result });
    return result;
  }

  async getTenantProvisioningView(tenantId: string) {
    const profile = await getTenantBusinessProfile(tenantId);
    const enabledRows = await listTenantEnabledModules(tenantId);
    const dashboards = await listTenantDashboardConfigs(tenantId);
    const workflows = await listTenantWorkflowTemplates(tenantId);
    const submodules = await listTenantEnabledSubmoduleCodes(tenantId);

    return { profile, enabledRows, dashboards, workflows, submodules };
  }

  private async resolveConfigByIds(businessTypeId: string, businessSubcategoryId: string) {
    const match = await getSubcategoryById(businessSubcategoryId);
    if (!match || match.type.id !== businessTypeId) {
      throw new Error("INVALID_BUSINESS_SELECTION");
    }
    return resolveBusinessConfig(
      match.type.slug,
      match.subcategory.slug,
      match.subcategory.legacyKey ?? undefined
    );
  }

  private toPreview(config: ResolvedBusinessConfig): ProvisioningPreview {
    return {
      erpModules: config.erpModules,
      erpSubmodules: config.erpSubmodules,
      dashboards: config.dashboards,
      workflows: config.workflows,
      roleTemplates: config.roleTemplates,
      reports: config.reports,
      navigation: config.navigation,
      branchDefaults: config.branchDefaults,
    };
  }

  private async syncLegacyTenantFields(
    tenantId: string,
    resolved: ResolvedBusinessConfig,
    draft: OnboardingDraftInput | undefined,
    now: string
  ) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("tenants")
      .update({
        business_type: resolved.legacyKey,
        industry_subtype: draft?.industrySubtype ?? null,
        employee_count: draft?.employeeCount ?? null,
        business_size: draft?.businessSize ?? null,
        onboarding_draft: draft ?? null,
        onboarding_completed_at: now,
        onboarding_locked: true,
        enabled_submodules: resolved.erpSubmodules,
        updated_at: now,
      })
      .eq("id", tenantId);

    if (error && !isMissingSchemaError(error)) throw error;
  }

  private async audit(
    tenantId: string,
    userId: string,
    action: string,
    payload: Record<string, unknown>
  ) {
    try {
      await writeActivityLog({
        tenantId,
        userId,
        module: "provisioning",
        action,
        entityType: "tenant",
        entityId: tenantId,
        payload,
      });
    } catch {
      const supabase = createAdminClient();
      await supabase.from("activity_logs").insert({
        tenant_id: tenantId,
        user_id: userId,
        module: "provisioning",
        action,
        entity_type: "tenant",
        entity_id: tenantId,
        payload,
      });
    }
  }
}

export const businessProvisioningService = new BusinessProvisioningService();

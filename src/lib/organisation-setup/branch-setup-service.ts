import { createAdminClient } from "@/lib/supabase/admin";
import {
  designationToLegacyOffice,
  mapBranchRow,
  statusToDb,
  type BranchListItem,
} from "@/lib/organisation-setup/mappers";
import { filterModulesToTenant, getTenantAvailableModules, buildSubmoduleParentMap } from "@/lib/organisation-setup/module-availability";
import { listBranchModules, replaceBranchModules } from "@/repositories/organisation-setup/branch-modules";
import { writeBranchAuditLog } from "@/repositories/organisation-setup/branch-audit";
import type { CreateBranchInput } from "@/validators/organisation-setup";

export type BranchListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  designation?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export class BranchSetupService {
  async listBranches(tenantId: string, query: BranchListQuery) {
    const supabase = createAdminClient();
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count: primaryCount } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_primary", true)
      .is("deleted_at", null);

    let dbQuery = supabase
      .from("branches")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order(query.sortBy === "branch_name" ? "name" : "created_at", {
        ascending: query.sortOrder === "asc",
      });

    if (query.status) {
      dbQuery = dbQuery.eq("status", query.status === "active" ? "ACTIVE" : "INACTIVE");
    }
    if (query.designation) {
      dbQuery = dbQuery.eq("designation", query.designation);
    }
    if (query.search) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query.search}%,code.ilike.%${query.search}%,city.ilike.%${query.search}%,area.ilike.%${query.search}%`
      );
    }

    const { data, error, count } = await dbQuery.range(from, to);
    if (error) throw error;

    const items: BranchListItem[] = [];
    for (const row of data ?? []) {
      const modules = await listBranchModules(tenantId, (row as { id: string }).id);
      items.push(mapBranchRow(row as Record<string, unknown>, modules));
    }

    return {
      data: items,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) || 1 },
      filters: { status: query.status ?? null, designation: query.designation ?? null },
      hasPrimaryOffice: (primaryCount ?? 0) > 0,
    };
  }

  async validateBranchCode(tenantId: string, branchCode: string, excludeBranchId?: string) {
    const supabase = createAdminClient();
    let query = supabase
      .from("branches")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("code", branchCode)
      .is("deleted_at", null);

    if (excludeBranchId) query = query.neq("id", excludeBranchId);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return { available: !data };
  }

  async assertPrimaryOfficeRules(tenantId: string, designation: string, excludeBranchId?: string) {
    if (designation !== "primary" && designation !== "primary_corporate") return;

    const supabase = createAdminClient();
    let query = supabase
      .from("branches")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("is_primary", true)
      .is("deleted_at", null);

    if (excludeBranchId) query = query.neq("id", excludeBranchId);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) {
      throw new Error("PRIMARY_OFFICE_EXISTS");
    }
  }

  async createBranch(tenantId: string, userId: string, input: CreateBranchInput) {
    await this.assertPrimaryOfficeRules(tenantId, input.designation);
    const codeCheck = await this.validateBranchCode(tenantId, input.branch_code);
    if (!codeCheck.available) throw new Error("DUPLICATE_BRANCH_CODE");

    const tenantModulesList = await getTenantAvailableModules(tenantId);
    const tenantModules = tenantModulesList.map((m) => m.moduleCode);
    const submoduleParentMap = buildSubmoduleParentMap(tenantModulesList);
    const filtered = filterModulesToTenant(tenantModules, input.enabled_modules, input.enabled_submodules);

    const legacy = designationToLegacyOffice(input.designation);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("branches")
      .insert({
        tenant_id: tenantId,
        name: input.branch_name,
        code: input.branch_code,
        description: input.area,
        office_type: legacy.officeType,
        country: input.country,
        state: input.state,
        city: input.city,
        address: input.address ?? null,
        pincode: input.pincode,
        area: input.area,
        designation: input.designation,
        is_primary: legacy.isPrimary,
        is_corporate: legacy.isCorporate,
        status: statusToDb(input.status),
        created_by: userId,
        updated_by: userId,
      })
      .select("*")
      .single();

    if (error) throw error;

    const branchId = (data as { id: string }).id;
    await replaceBranchModules(tenantId, branchId, filtered.modules, filtered.submodules, submoduleParentMap);

    const modules = await listBranchModules(tenantId, branchId);
    const mapped = mapBranchRow(data as Record<string, unknown>, modules);

    await writeBranchAuditLog({
      tenantId,
      branchId,
      action: "branch_created",
      newData: mapped as unknown as Record<string, unknown>,
      performedBy: userId,
    });

    return mapped;
  }

  async updateBranch(
    tenantId: string,
    userId: string,
    branchId: string,
    input: Partial<CreateBranchInput>
  ) {
    const existingModules = await listBranchModules(tenantId, branchId);
    const supabase = createAdminClient();
    const { data: existing, error: fetchErr } = await supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", branchId)
      .is("deleted_at", null)
      .single();
    if (fetchErr) throw fetchErr;

    const oldMapped = mapBranchRow(existing as Record<string, unknown>, existingModules);

    if (input.designation) {
      await this.assertPrimaryOfficeRules(tenantId, input.designation, branchId);
    }
    if (input.branch_code) {
      const codeCheck = await this.validateBranchCode(tenantId, input.branch_code, branchId);
      if (!codeCheck.available) throw new Error("DUPLICATE_BRANCH_CODE");
    }

    const payload: Record<string, unknown> = { updated_by: userId };
    if (input.branch_name) payload.name = input.branch_name;
    if (input.branch_code) payload.code = input.branch_code;
    if (input.country) payload.country = input.country;
    if (input.state) payload.state = input.state;
    if (input.city) payload.city = input.city;
    if (input.pincode) payload.pincode = input.pincode;
    if (input.area) {
      payload.area = input.area;
      payload.description = input.area;
    }
    if (input.address !== undefined) payload.address = input.address;
    if (input.status) payload.status = statusToDb(input.status);
    if (input.designation) {
      const legacy = designationToLegacyOffice(input.designation);
      payload.designation = input.designation;
      payload.office_type = legacy.officeType;
      payload.is_primary = legacy.isPrimary;
      payload.is_corporate = legacy.isCorporate;
    }

    const { data, error } = await supabase
      .from("branches")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", branchId)
      .select("*")
      .single();
    if (error) throw error;

    if (input.enabled_modules || input.enabled_submodules) {
      const tenantModulesList = await getTenantAvailableModules(tenantId);
      const tenantModules = tenantModulesList.map((m) => m.moduleCode);
      const submoduleParentMap = buildSubmoduleParentMap(tenantModulesList);
      const filtered = filterModulesToTenant(
        tenantModules,
        input.enabled_modules ?? oldMapped.enabledModules,
        input.enabled_submodules ?? oldMapped.enabledSubmodules
      );
      await replaceBranchModules(tenantId, branchId, filtered.modules, filtered.submodules, submoduleParentMap);
    }

    const modules = await listBranchModules(tenantId, branchId);
    const mapped = mapBranchRow(data as Record<string, unknown>, modules);

    await writeBranchAuditLog({
      tenantId,
      branchId,
      action: "branch_updated",
      oldData: oldMapped as unknown as Record<string, unknown>,
      newData: mapped as unknown as Record<string, unknown>,
      performedBy: userId,
    });

    return mapped;
  }

  async deleteBranch(tenantId: string, userId: string, branchId: string) {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", branchId)
      .maybeSingle();

    const { error } = await supabase
      .from("branches")
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq("tenant_id", tenantId)
      .eq("id", branchId);
    if (error) throw error;

    await writeBranchAuditLog({
      tenantId,
      branchId,
      action: "branch_deleted",
      oldData: existing as Record<string, unknown> | null,
      performedBy: userId,
    });

    return { id: branchId };
  }

  async getBranch(tenantId: string, branchId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", branchId)
      .is("deleted_at", null)
      .single();
    if (error) throw error;
    const modules = await listBranchModules(tenantId, branchId);
    return mapBranchRow(data as Record<string, unknown>, modules);
  }
}

export const branchSetupService = new BranchSetupService();

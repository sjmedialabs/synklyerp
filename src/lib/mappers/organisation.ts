import type { Database } from "@/types/database";

type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];
type DesignationRow = Database["public"]["Tables"]["designations"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type Branch = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  officeType: string;
  country: string;
  state: string;
  city: string;
  address: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Division = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  modulesAssigned: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Designation = {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgUser = {
  id: string;
  tenantId: string | null;
  userCode: string | null;
  name: string | null;
  email: string;
  designationId: string | null;
  department: string | null;
  branchId: string | null;
  roleId: string | null;
  status: string;
  joinedAt: string;
  createdAt: string;
  role?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
};

export function mapBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    code: row.code,
    description: row.description,
    officeType: row.office_type,
    country: row.country,
    state: row.state,
    city: row.city,
    address: row.address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDivision(row: DivisionRow): Division {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    code: row.code,
    description: row.description,
    modulesAssigned: row.modules_assigned ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDesignation(row: DesignationRow): Designation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function branchToDb(
  data: Omit<Branch, "id" | "tenantId" | "createdAt" | "updatedAt"> & { tenantId: string }
) {
  return {
    tenant_id: data.tenantId,
    name: data.name,
    code: data.code,
    description: data.description,
    office_type: data.officeType,
    country: data.country,
    state: data.state,
    city: data.city,
    address: data.address,
    status: data.status,
  };
}

export function divisionToDb(
  data: Omit<Division, "id" | "tenantId" | "createdAt" | "updatedAt"> & { tenantId: string }
) {
  return {
    tenant_id: data.tenantId,
    name: data.name,
    code: data.code,
    description: data.description,
    modules_assigned: data.modulesAssigned,
    status: data.status,
  };
}

export function designationToDb(data: { tenantId: string; name: string; status: string }) {
  return {
    tenant_id: data.tenantId,
    name: data.name,
    status: data.status,
  };
}

export function mapOrgUser(
  row: UserRow & {
    roles?: { id: string; name: string } | null;
    designations?: { id: string; name: string } | null;
    branches?: { id: string; name: string } | null;
  }
): OrgUser {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userCode: row.user_code,
    name: row.name,
    email: row.email,
    designationId: row.designation_id,
    department: row.department,
    branchId: row.branch_id,
    roleId: row.role_id,
    status: row.status,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    role: row.roles ?? null,
    designation: row.designations ?? null,
    branch: row.branches ?? null,
  };
}

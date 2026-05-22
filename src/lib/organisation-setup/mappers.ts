import type { BranchDesignation } from "@/validators/organisation-setup";

export function designationToLegacyOffice(designation: BranchDesignation) {
  switch (designation) {
    case "primary":
      return { officeType: "Primary", isPrimary: true, isCorporate: false };
    case "corporate":
      return { officeType: "Corporate", isPrimary: false, isCorporate: true };
    case "primary_corporate":
      return { officeType: "Both", isPrimary: true, isCorporate: true };
    default:
      return { officeType: "None", isPrimary: false, isCorporate: false };
  }
}

export function legacyOfficeToDesignation(
  officeType: string,
  isPrimary?: boolean,
  isCorporate?: boolean
): BranchDesignation {
  if (isPrimary && isCorporate) return "primary_corporate";
  if (isPrimary || officeType === "Primary") return "primary";
  if (isCorporate || officeType === "Corporate") return "corporate";
  if (officeType === "Both") return "primary_corporate";
  return "regular";
}

export function statusToDb(status: "active" | "inactive") {
  return status === "active" ? "ACTIVE" : "INACTIVE";
}

export function statusFromDb(status: string): "active" | "inactive" {
  return status === "ACTIVE" ? "active" : "inactive";
}

export type BranchListItem = {
  id: string;
  branchName: string;
  branchCode: string;
  country: string;
  state: string;
  city: string;
  pincode: string | null;
  area: string | null;
  address: string | null;
  status: "active" | "inactive";
  designation: BranchDesignation;
  isPrimary: boolean;
  isCorporate: boolean;
  enabledModules: string[];
  enabledSubmodules: string[];
  createdAt: string;
  updatedAt: string;
};

export function mapBranchRow(row: Record<string, unknown>, modules: { moduleCode: string; submoduleCode: string | null }[]): BranchListItem {
  const designation = legacyOfficeToDesignation(
    String(row.office_type ?? "None"),
    Boolean(row.is_primary),
    Boolean(row.is_corporate)
  );
  const moduleCodes = [...new Set(modules.filter((m) => !m.submoduleCode).map((m) => m.moduleCode))];
  const submoduleCodes = modules.filter((m) => m.submoduleCode).map((m) => m.submoduleCode as string);

  return {
    id: row.id as string,
    branchName: row.name as string,
    branchCode: row.code as string,
    country: row.country as string,
    state: row.state as string,
    city: row.city as string,
    pincode: (row.pincode as string | null) ?? null,
    area: (row.area as string | null) ?? (typeof row.description === "string" ? row.description : null),
    address: (row.address as string | null) ?? null,
    status: statusFromDb(String(row.status)),
    designation,
    isPrimary: Boolean(row.is_primary),
    isCorporate: Boolean(row.is_corporate),
    enabledModules: moduleCodes,
    enabledSubmodules: submoduleCodes,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

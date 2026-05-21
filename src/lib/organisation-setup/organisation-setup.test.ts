import { describe, expect, it } from "vitest";
import {
  designationToLegacyOffice,
  legacyOfficeToDesignation,
  statusFromDb,
  statusToDb,
} from "@/lib/organisation-setup/mappers";
import { filterModulesToTenant, buildSubmoduleParentMap } from "@/lib/organisation-setup/module-availability";
import { createBranchSchema, validateBranchCodeSchema } from "@/validators/organisation-setup";

describe("organisation-setup mappers", () => {
  it("maps designation to legacy office flags", () => {
    expect(designationToLegacyOffice("primary")).toEqual({
      officeType: "Primary",
      isPrimary: true,
      isCorporate: false,
    });
    expect(designationToLegacyOffice("primary_corporate")).toEqual({
      officeType: "Both",
      isPrimary: true,
      isCorporate: true,
    });
  });

  it("maps legacy office back to designation", () => {
    expect(legacyOfficeToDesignation("Both", true, true)).toBe("primary_corporate");
    expect(legacyOfficeToDesignation("None")).toBe("regular");
  });

  it("maps status between API and DB", () => {
    expect(statusToDb("active")).toBe("ACTIVE");
    expect(statusFromDb("INACTIVE")).toBe("inactive");
  });
});

describe("organisation-setup validators", () => {
  it("accepts valid branch payload", () => {
    const parsed = createBranchSchema.parse({
      branch_name: "Hyderabad Main",
      branch_code: "HYD-001",
      country: "India",
      state: "Telangana",
      city: "Hyderabad",
      pincode: "500081",
      area: "HITEC City",
      designation: "regular",
    });
    expect(parsed.branch_code).toBe("HYD-001");
  });

  it("rejects invalid pincode", () => {
    expect(() =>
      createBranchSchema.parse({
        branch_name: "Test",
        branch_code: "T-1",
        country: "India",
        state: "Telangana",
        city: "Hyderabad",
        pincode: "abc",
        area: "Area",
      })
    ).toThrow();
  });

  it("validates branch code request", () => {
    expect(validateBranchCodeSchema.parse({ branch_code: "HYD-001" }).branch_code).toBe("HYD-001");
  });
});

describe("module availability helpers", () => {
  it("filters enabled modules to tenant allow-list", () => {
    const result = filterModulesToTenant(["HR", "Finance"], ["HR", "Sales"], ["crm"]);
    expect(result.modules).toEqual(["HR"]);
    expect(result.submodules).toEqual(["crm"]);
  });

  it("builds submodule parent map", () => {
    const map = buildSubmoduleParentMap([
      { moduleCode: "Sales", label: "Sales", submodules: [{ code: "crm", label: "CRM" }] },
      { moduleCode: "Operations", label: "Ops", submodules: [{ code: "inventory_management", label: "Inventory" }] },
    ]);
    expect(map.crm).toBe("Sales");
    expect(map.inventory_management).toBe("Operations");
  });
});

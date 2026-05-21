import { describe, expect, it } from "vitest";
import { resolveBusinessConfig } from "@/business-configs";

describe("resolveBusinessConfig", () => {
  it("returns product modules for product business type", () => {
    const config = resolveBusinessConfig("product", "retail", "Retail");
    expect(config.erpModules).toContain("Sales");
    expect(config.erpModules).toContain("Operations");
    expect(config.erpSubmodules).toContain("inventory_management");
  });

  it("returns service workflows for service business type", () => {
    const config = resolveBusinessConfig("service", "it-services", "IT Services");
    expect(config.erpModules).toContain("Projects");
    expect(config.workflows.length).toBeGreaterThan(0);
    expect(config.roleTemplates.some((r) => r.templateCode === "project-manager")).toBe(true);
  });

  it("returns hybrid branch defaults", () => {
    const config = resolveBusinessConfig("hybrid", "franchise", "Franchise");
    expect(config.erpModules.length).toBeGreaterThan(4);
    expect(config.branchDefaults.some((b) => b.branchType === "branch")).toBe(true);
  });
});

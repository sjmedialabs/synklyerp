import { describe, expect, it } from "vitest";
import { BusinessProvisioningService } from "@/lib/provisioning/business-provisioning-service";

describe("BusinessProvisioningService", () => {
  const service = new BusinessProvisioningService();

  it("previews legacy onboarding draft without database access", async () => {
    const preview = await service.previewByLegacyDraft({
      businessType: "Product",
      industrySubtype: "Retail",
    });
    expect(preview.erpModules.length).toBeGreaterThan(0);
    expect(preview.erpSubmodules.length).toBeGreaterThan(0);
    expect(preview.dashboards.length).toBeGreaterThan(0);
  });
});

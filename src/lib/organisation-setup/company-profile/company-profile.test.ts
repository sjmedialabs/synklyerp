import { describe, expect, it } from "vitest";
import { calculateProfileProgress, isSectionComplete } from "@/lib/organisation-setup/company-profile/completion";
import {
  GSTIN_REGEX,
  PAN_REGEX,
  IFSC_REGEX,
  companyProfileSchema,
} from "@/validators/company-profile";

describe("company profile completion", () => {
  it("tracks section completion", () => {
    const partial = {
      legal_company_name: "Synkly ERP Pvt Ltd",
      company_type: "private_limited" as const,
      industry_type: "Product",
      subcategory: "Manufacturing",
      incorporation_date: "2020-01-15",
    };
    expect(isSectionComplete("basic", partial)).toBe(true);
    expect(isSectionComplete("registration", partial)).toBe(false);
  });

  it("calculates progress percentage", () => {
    const progress = calculateProfileProgress({
      legal_company_name: "Acme",
      company_type: "llp",
      industry_type: "Service",
      subcategory: "Consulting",
      incorporation_date: "2019-05-01",
    });
    expect(progress.totalSections).toBe(7);
    expect(progress.percentage).toBeGreaterThan(0);
    expect(progress.percentage).toBeLessThan(100);
  });
});

describe("company profile validators", () => {
  it("validates GSTIN, PAN, and IFSC patterns", () => {
    expect(GSTIN_REGEX.test("22AAAAA0000A1Z5")).toBe(true);
    expect(PAN_REGEX.test("ABCDE1234F")).toBe(true);
    expect(IFSC_REGEX.test("HDFC0001234")).toBe(true);
  });

  it("requires CIN for private limited", () => {
    expect(() =>
      companyProfileSchema.parse({
        legal_company_name: "Synkly ERP Private Limited",
        company_type: "private_limited",
        industry_type: "Product",
        subcategory: "Manufacturing",
        incorporation_date: "2020-01-01",
        gst_number: "22AAAAA0000A1Z5",
        pan_number: "ABCDE1234F",
        cin_number: "",
        address_line_1: "Plot 1",
        country: "India",
        state: "Telangana",
        city: "Hyderabad",
        pincode: "500081",
        official_email: "admin@synkly.com",
        contact_phone: "+919876543210",
        business_description: "Enterprise ERP platform for SMBs and mid-market.",
        employee_range: "11-50",
        bank_account_name: "Synkly ERP",
        bank_name: "HDFC Bank",
        account_number: "123456789012",
        ifsc_code: "HDFC0001234",
        bank_branch_name: "HITEC City",
      })
    ).toThrow();
  });
});

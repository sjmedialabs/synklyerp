"use client";

import { motion } from "framer-motion";
import { Label, Select } from "@/components/ui/input";
import { BUSINESS_SIZES, EMPLOYEE_COUNT_RANGES } from "@/constants/onboarding";
import type { OrganizationSetupInput } from "@/validators/onboarding-session";

type OrganizationStepProps = {
  data: Partial<OrganizationSetupInput>;
  employeeCount: OrganizationSetupInput["numberOfEmployees"] | null;
  businessSize: OrganizationSetupInput["businessSize"] | null;
  onChange: (data: Partial<OrganizationSetupInput>) => void;
  onEmployeeCountChange: (value: OrganizationSetupInput["numberOfEmployees"]) => void;
  onBusinessSizeChange: (value: OrganizationSetupInput["businessSize"]) => void;
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && " *"}
      </Label>
      {children}
    </div>
  );
}

const inputClass =
  "mt-1.5 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900";

export function OrganizationStep({
  data,
  employeeCount,
  businessSize,
  onChange,
  onEmployeeCountChange,
  onBusinessSizeChange,
}: OrganizationStepProps) {
  const set = (key: keyof OrganizationSetupInput, value: string) =>
    onChange({ [key]: value });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Organization setup</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tell us about your company. This information powers your workspace profile and compliance settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" required>
          <input
            className={inputClass}
            value={data.companyName ?? ""}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Acme Corporation Pvt Ltd"
          />
        </Field>
        <Field label="Trade name">
          <input
            className={inputClass}
            value={data.tradeName ?? ""}
            onChange={(e) => set("tradeName", e.target.value)}
            placeholder="Acme"
          />
        </Field>
        <Field label="GSTIN">
          <input
            className={inputClass}
            value={data.gstin ?? ""}
            onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
          />
        </Field>
        <Field label="PAN">
          <input
            className={inputClass}
            value={data.pan ?? ""}
            onChange={(e) => set("pan", e.target.value.toUpperCase())}
            placeholder="AAAAA0000A"
          />
        </Field>
        <Field label="CIN">
          <input
            className={inputClass}
            value={data.cin ?? ""}
            onChange={(e) => set("cin", e.target.value)}
            placeholder="U12345MH2020PTC123456"
          />
        </Field>
        <Field label="Business email">
          <input
            type="email"
            className={inputClass}
            value={data.businessEmail ?? ""}
            onChange={(e) => set("businessEmail", e.target.value)}
            placeholder="hello@company.com"
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            value={data.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+919876543210"
          />
        </Field>
        <Field label="Website">
          <input
            className={inputClass}
            value={data.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://company.com"
          />
        </Field>
        <Field label="Country">
          <input
            className={inputClass}
            value={data.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            placeholder="India"
          />
        </Field>
        <Field label="State">
          <input
            className={inputClass}
            value={data.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
            placeholder="Maharashtra"
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            value={data.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Mumbai"
          />
        </Field>
        <Field label="Timezone">
          <input
            className={inputClass}
            value={data.timezone ?? "Asia/Kolkata"}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClass}
            value={data.currency ?? "INR"}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
            maxLength={3}
          />
        </Field>
        <Field label="Financial year">
          <input
            className={inputClass}
            value={data.financialYear ?? "April - March"}
            onChange={(e) => set("financialYear", e.target.value)}
          />
        </Field>
        <Field label="Employee count">
          <Select
            value={employeeCount ?? ""}
            onChange={(e) => onEmployeeCountChange(e.target.value as OrganizationSetupInput["numberOfEmployees"])}
          >
            <option value="">Select range</option>
            {EMPLOYEE_COUNT_RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Business size">
          <Select
            value={businessSize ?? ""}
            onChange={(e) => onBusinessSizeChange(e.target.value as OrganizationSetupInput["businessSize"])}
          >
            <option value="">Select size</option>
            {BUSINESS_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Registered address">
        <textarea
          className={`${inputClass} min-h-[88px] py-2`}
          value={data.address ?? ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Full registered business address"
        />
      </Field>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  EMPLOYEE_COUNT_RANGES,
  INDUSTRY_SUBTYPES,
  type BusinessType,
} from "@/constants/onboarding";
import { useOnboardingState, useSaveOnboardingDraft } from "@/hooks/tenant/use-onboarding";
import type { OnboardingDraftInput } from "@/validators/onboarding";

export default function BusinessTypePage() {
  const { data: session } = useSession();
  const { data: state, isLoading } = useOnboardingState();
  const saveDraft = useSaveOnboardingDraft();
  const locked = state?.locked ?? false;
  const [form, setForm] = useState<OnboardingDraftInput>({
    businessType: "Hybrid",
    industrySubtype: "IT Services",
    employeeCount: "11-50",
    businessSize: "SMB",
  });

  useEffect(() => {
    if (state?.draft) setForm(state.draft);
    else if (state) {
      setForm({
        businessType: (state.businessType as BusinessType) || "Hybrid",
        industrySubtype: state.industrySubtype ?? "Other",
        employeeCount: (state.employeeCount as OnboardingDraftInput["employeeCount"]) ?? "11-50",
        businessSize: (state.businessSize as OnboardingDraftInput["businessSize"]) ?? "SMB",
      });
    }
  }, [state]);

  const save = async () => {
    if (locked) {
      toast.error("Business profile is locked after onboarding confirmation.");
      return;
    }
    try {
      await saveDraft.mutateAsync(form);
      toast.success("Business profile saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const industries = INDUSTRY_SUBTYPES[form.businessType];

  return (
    <div>
      <PageHeader
        title="Business Type"
        description="Configure how SynklyERP adapts modules and defaults for your organisation."
        badge={locked ? "Locked" : session?.user?.businessType ?? undefined}
      />

      {!state?.completed && (
        <p className="mb-4 text-sm text-indigo-600">
          Complete the{" "}
          <Link href="/onboarding" className="font-medium underline">
            onboarding wizard
          </Link>{" "}
          to activate modules for your workspace.
        </p>
      )}

      <div className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Label>Business category *</Label>
          <Select
            value={form.businessType}
            disabled={locked || isLoading}
            onChange={(e) => {
              const businessType = e.target.value as BusinessType;
              setForm({
                ...form,
                businessType,
                industrySubtype: INDUSTRY_SUBTYPES[businessType][0] ?? "Other",
              });
            }}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Industry subtype *</Label>
          <Select
            value={form.industrySubtype}
            disabled={locked || isLoading}
            onChange={(e) => setForm({ ...form, industrySubtype: e.target.value })}
          >
            {industries.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Employee count *</Label>
          <Select
            value={form.employeeCount}
            disabled={locked || isLoading}
            onChange={(e) =>
              setForm({
                ...form,
                employeeCount: e.target.value as OnboardingDraftInput["employeeCount"],
              })
            }
          >
            {EMPLOYEE_COUNT_RANGES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Business size</Label>
          <Select
            value={form.businessSize}
            disabled={locked || isLoading}
            onChange={(e) =>
              setForm({
                ...form,
                businessSize: e.target.value as OnboardingDraftInput["businessSize"],
              })
            }
          >
            {BUSINESS_SIZES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        {state?.enabledModules?.length ? (
          <div>
            <Label>Active modules</Label>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {state.enabledModules.join(", ")}
            </p>
          </div>
        ) : null}

        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={save}
          disabled={locked || saveDraft.isPending || isLoading}
        >
          {locked ? "Profile locked" : saveDraft.isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

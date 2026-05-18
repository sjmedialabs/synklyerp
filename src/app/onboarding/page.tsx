"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  EMPLOYEE_COUNT_RANGES,
  INDUSTRY_SUBTYPES,
  type BusinessType,
  type ErpModuleKey,
} from "@/constants/onboarding";
import { moduleLabel, resolveModulesForBusinessType } from "@/lib/modules/activation";
import {
  useConfirmOnboarding,
  useOnboardingState,
  useSaveOnboardingDraft,
} from "@/hooks/tenant/use-onboarding";
import type { OnboardingDraftInput } from "@/validators/onboarding";

const STEPS = ["Business profile", "Organisation size", "Review & confirm"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { data: state, isLoading } = useOnboardingState();
  const saveDraft = useSaveOnboardingDraft();
  const confirm = useConfirmOnboarding();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingDraftInput>({
    businessType: "Hybrid",
    industrySubtype: "IT Services",
    employeeCount: "11-50",
    businessSize: "SMB",
  });

  useEffect(() => {
    if (state?.draft) {
      setForm(state.draft);
    } else if (state) {
      setForm({
        businessType: (state.businessType as BusinessType) || "Hybrid",
        industrySubtype: state.industrySubtype ?? "Other",
        employeeCount: (state.employeeCount as OnboardingDraftInput["employeeCount"]) ?? "11-50",
        businessSize: (state.businessSize as OnboardingDraftInput["businessSize"]) ?? "SMB",
      });
    }
  }, [state]);

  useEffect(() => {
    if (state?.completed) {
      router.replace("/app");
    }
  }, [state?.completed, router]);

  const previewModules = useMemo(
    () => state?.previewModules ?? resolveModulesForBusinessType(form.businessType),
    [state?.previewModules, form.businessType]
  );

  const industries = INDUSTRY_SUBTYPES[form.businessType];

  const persistDraft = async () => {
    await saveDraft.mutateAsync(form);
  };

  const next = async () => {
    try {
      await persistDraft();
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save progress");
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleConfirm = async () => {
    try {
      await persistDraft();
      await confirm.mutateAsync();
      await update();
      toast.success("Workspace configured. Welcome to SynklyERP!");
      router.replace("/app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirmation failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading onboarding...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Set up {session?.user?.tenantName ?? "your workspace"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose your business profile once. This configuration is locked after confirmation.
        </p>
      </header>

      <ol className="mb-8 flex flex-wrap justify-center gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === step
                ? "bg-indigo-600 text-white"
                : i < step
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Business category *</Label>
              <Select
                value={form.businessType}
                onChange={(e) => {
                  const businessType = e.target.value as BusinessType;
                  const subtypes = INDUSTRY_SUBTYPES[businessType];
                  setForm({
                    ...form,
                    businessType,
                    industrySubtype: subtypes[0] ?? "Other",
                  });
                }}
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}-based
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                Product businesses get Sales & Operations. Service businesses get CRM & Projects.
                Hybrid enables the full module set.
              </p>
            </div>
            <div>
              <Label>Industry subtype *</Label>
              <Select
                value={form.industrySubtype}
                onChange={(e) => setForm({ ...form, industrySubtype: e.target.value })}
              >
                {industries.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Employee count *</Label>
              <Select
                value={form.employeeCount}
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your selection</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Business type</dt>
                  <dd className="font-medium">{form.businessType}-based</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Industry</dt>
                  <dd className="font-medium">{form.industrySubtype}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Employees</dt>
                  <dd className="font-medium">{form.employeeCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Business size</dt>
                  <dd className="font-medium">{form.businessSize}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
                onClick={() => setStep(0)}
              >
                Edit selection
              </button>
            </div>

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Layers size={16} className="text-indigo-600" />
                Modules that will activate
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {previewModules.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    {moduleLabel(key as ErpModuleKey)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                After confirmation, business type and module activation cannot be changed.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0 || saveDraft.isPending}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={next}
            disabled={saveDraft.isPending}
          >
            Continue
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={handleConfirm}
            disabled={confirm.isPending || saveDraft.isPending}
          >
            {confirm.isPending ? "Activating..." : "Confirm & go to dashboard"}
          </Button>
        )}
      </footer>
    </div>
  );
}

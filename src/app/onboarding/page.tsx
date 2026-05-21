"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Layers, Package, Briefcase, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  BUSINESS_SIZES,
  BUSINESS_TYPE_DESCRIPTIONS,
  BUSINESS_TYPE_SCOPE,
  BUSINESS_TYPES,
  EMPLOYEE_COUNT_RANGES,
  INDUSTRY_SUBTYPES,
  type BusinessType,
  type ErpModuleKey,
  type ErpSubmoduleKey,
} from "@/constants/onboarding";
import {
  moduleLabel,
  resolveOnboardingProvisioning,
  submoduleLabel,
} from "@/lib/modules/activation";
import {
  useConfirmOnboarding,
  useOnboardingState,
  useSaveOnboardingDraft,
} from "@/hooks/tenant/use-onboarding";
import { useBusinessTypes, resolveCatalogSelection } from "@/hooks/provisioning/use-business-types";
import { ConfirmationModal } from "@/components/onboarding/confirmation-modal";
import { ProvisioningLoader } from "@/components/onboarding/provisioning-loader";
import { OnboardingSuccess } from "@/components/onboarding/onboarding-success";
import { getBusinessConfigByLegacyKey } from "@/business-configs";
import { fetchApi } from "@/lib/api/client";
import type { OnboardingDraftInput } from "@/validators/onboarding";

const STEPS = ["Business profile", "Organisation size", "Review & confirm"] as const;

const BUSINESS_TYPE_ICONS = {
  Product: Package,
  Service: Briefcase,
  Hybrid: Shuffle,
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const { data: state, isLoading } = useOnboardingState();
  const saveDraft = useSaveOnboardingDraft();
  const confirm = useConfirmOnboarding();
  const { data: businessTypes } = useBusinessTypes();
  const [step, setStep] = useState(0);
  const [uiPhase, setUiPhase] = useState<"wizard" | "provisioning" | "success">("wizard");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ modules: number; submodules: number } | null>(null);
  const [form, setForm] = useState<OnboardingDraftInput>({
    businessType: "Product",
    industrySubtype: "Manufacturing",
    employeeCount: "11-50",
    businessSize: "SMB",
  });

  const isAdmin = session?.user?.role === "ADMIN";
  const isWaiting = searchParams.get("waiting") === "1" || !isAdmin;

  useEffect(() => {
    if (state?.draft) {
      setForm(state.draft);
    } else if (state) {
      const businessType = (state.businessType as BusinessType) || "Product";
      setForm({
        businessType,
        industrySubtype: state.industrySubtype ?? INDUSTRY_SUBTYPES[businessType][0],
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

  const provisioning = useMemo(
    () =>
      state?.previewModules && state?.previewSubmodules
        ? { modules: state.previewModules, submodules: state.previewSubmodules }
        : resolveOnboardingProvisioning(form.businessType, form.industrySubtype),
    [state?.previewModules, state?.previewSubmodules, form.businessType, form.industrySubtype]
  );

  const previewModules = provisioning.modules;
  const previewSubmodules = provisioning.submodules;
  const workflowPreview = getBusinessConfigByLegacyKey(form.businessType)?.workflows.map((w) => w.name) ?? [];

  const selectionReady = !!form.businessType && !!form.industrySubtype;

  const persistDraft = async () => {
    await saveDraft.mutateAsync(form);
  };

  const next = async () => {
    if (step === 0 && !selectionReady) {
      toast.error("Select a business type and subcategory");
      return;
    }
    try {
      await persistDraft();
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save progress");
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setUiPhase("provisioning");
    try {
      await persistDraft();
      const selection = resolveCatalogSelection(businessTypes, form.businessType, form.industrySubtype);
      if (selection && !selection.type.id.startsWith("fallback-")) {
        const result = await fetchApi<{ enabledModules: string[]; enabledSubmodules: string[] }>(
          "/api/onboarding/business-profile",
          {
            method: "POST",
            body: JSON.stringify({
              business_type_id: selection.type.id,
              business_subcategory_id: selection.subcategory.id,
              confirmation: true,
            }),
          }
        );
        setProvisionResult({
          modules: result.enabledModules.length,
          submodules: result.enabledSubmodules.length,
        });
      } else {
        const result = await confirm.mutateAsync();
        setProvisionResult({
          modules: result.enabledModules.length,
          submodules: result.enabledSubmodules.length,
        });
      }
      await update();
      setUiPhase("success");
    } catch (e) {
      setUiPhase("wizard");
      toast.error(e instanceof Error ? e.message : "Confirmation failed");
    }
  };

  if (uiPhase === "provisioning") {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6">
        <ProvisioningLoader />
      </div>
    );
  }

  if (uiPhase === "success") {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6">
        <OnboardingSuccess
          moduleCount={provisionResult?.modules ?? previewModules.length}
          submoduleCount={provisionResult?.submodules ?? previewSubmodules.length}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading onboarding...</p>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
          S
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace setup in progress</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Your organisation admin is completing the initial business setup. You&apos;ll get full dashboard access once
          onboarding is confirmed.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Return to sign in
        </Link>
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
          {step === 0 ? "What kind of business are you?" : `Set up ${session?.user?.tenantName ?? "your workspace"}`}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === 0
            ? "This helps us customise your experience."
            : "Choose your business profile once. This configuration is locked after confirmation."}
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
          <div className="space-y-6">
            <div className="grid gap-4">
              {BUSINESS_TYPES.map((type) => {
                const Icon = BUSINESS_TYPE_ICONS[type];
                const selected = form.businessType === type;
                const meta = BUSINESS_TYPE_DESCRIPTIONS[type];
                return (
                  <div
                    key={type}
                    className={`rounded-xl border p-4 transition ${
                      selected
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 dark:bg-indigo-950/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 text-left"
                      onClick={() =>
                        setForm({
                          ...form,
                          businessType: type,
                          industrySubtype: INDUSTRY_SUBTYPES[type][0],
                        })
                      }
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                        }`}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          <Icon size={18} className="text-indigo-600" />
                          {meta.title}
                        </span>
                        <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{meta.description}</span>
                      </span>
                    </button>

                    {selected && (
                      <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Scope includes
                          </p>
                          <ul className="grid gap-1 sm:grid-cols-2">
                            {BUSINESS_TYPE_SCOPE[type].slice(0, 6).map((item) => (
                              <li key={item} className="text-xs text-slate-600 dark:text-slate-400">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Subcategory
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {INDUSTRY_SUBTYPES[type].map((subtype) => (
                              <button
                                key={subtype}
                                type="button"
                                onClick={() => setForm({ ...form, industrySubtype: subtype })}
                                className={`rounded-full px-3 py-1.5 text-sm transition ${
                                  form.industrySubtype === subtype
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {subtype}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm your setup</h2>
              <p className="mt-1 text-sm text-slate-500">Please review your selections before proceeding.</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Selected configuration</h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Business type</dt>
                  <dd className="font-medium">{BUSINESS_TYPE_DESCRIPTIONS[form.businessType].title}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Subcategory</dt>
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
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Layers size={16} className="text-indigo-600" />
                ERP modules to be enabled
              </h3>
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
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Suggested workflows</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {workflowPreview.map((name) => (
                  <li
                    key={name}
                    className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Capabilities to be configured
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {previewSubmodules.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
                    {submoduleLabel(key as ErpSubmoduleKey)}
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
            disabled={saveDraft.isPending || (step === 0 && !selectionReady)}
          >
            {step === 0 ? "Continue →" : "Continue"}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setShowConfirmModal(true)}
            disabled={confirm.isPending || saveDraft.isPending}
          >
            Confirm & Proceed
          </Button>
        )}
      </footer>

      <ConfirmationModal
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        loading={confirm.isPending || saveDraft.isPending}
      />
    </div>
  );
}

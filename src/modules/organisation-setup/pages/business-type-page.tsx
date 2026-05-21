"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Layers,
  Loader2,
  Lock,
  Package,
  Shuffle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
import { getBusinessConfigByLegacyKey } from "@/business-configs";
import { useOnboardingState, useSaveOnboardingDraft } from "@/hooks/tenant/use-onboarding";
import { useBusinessTypes } from "@/hooks/provisioning/use-business-types";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import type { OnboardingDraftInput } from "@/validators/onboarding";

const BUSINESS_TYPE_ICONS = {
  Product: Package,
  Service: Briefcase,
  Hybrid: Shuffle,
} as const;

type BusinessProfileApi = {
  enabledModules: string[];
  enabledSubmodules: string[];
  workflows: { name: string; workflowCode?: string }[];
  dashboardConfig: { widgetCode: string; visible: boolean }[];
  provisioningStatus: string;
  onboardingCompleted: boolean;
  businessType: { name: string; legacyKey: string | null } | null;
  businessSubcategory: { name: string; legacyKey: string | null } | null;
};

export default function BusinessTypeSetupPage() {
  const { data: session } = useSession();
  const { data: state, isLoading } = useOnboardingState();
  const { data: catalog } = useBusinessTypes();
  const saveDraft = useSaveOnboardingDraft();
  const locked = state?.locked ?? false;
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: profileView, isLoading: profileLoading } = useQuery({
    queryKey: ["tenant", "business-profile", "setup"],
    queryFn: () => fetchApi<BusinessProfileApi>("/api/tenant/business-profile"),
    staleTime: 60_000,
  });

  const [form, setForm] = useState<OnboardingDraftInput>({
    businessType: "Product",
    industrySubtype: "Manufacturing",
    employeeCount: "11-50",
    businessSize: "SMB",
  });

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

  const preview = useMemo(
    () =>
      locked && state?.enabledModules?.length
        ? {
            modules: state.enabledModules as ErpModuleKey[],
            submodules: state.enabledSubmodules as ErpSubmoduleKey[],
          }
        : resolveOnboardingProvisioning(form.businessType, form.industrySubtype),
    [locked, state?.enabledModules, state?.enabledSubmodules, form.businessType, form.industrySubtype]
  );

  const workflowPreview =
    profileView?.workflows?.map((w) => w.name) ??
    getBusinessConfigByLegacyKey(form.businessType)?.workflows.map((w) => w.name) ??
    [];

  const catalogType = catalog?.find(
    (t) => t.legacyKey === form.businessType || t.slug === form.businessType.toLowerCase()
  );

  const save = async () => {
    if (!isAdmin) {
      toast.error("Only admins can update business type settings.");
      return;
    }
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

  if (isLoading || profileLoading) {
    return (
      <div className="flex gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading business profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Type"
        description="Configure how SynklyERP adapts modules, workflows, and defaults for your organisation."
        badge={
          locked ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Locked
            </span>
          ) : profileView?.provisioningStatus ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {profileView.provisioningStatus}
            </span>
          ) : undefined
        }
        actions={
          !locked && isAdmin ? (
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={save}
              disabled={saveDraft.isPending}
            >
              {saveDraft.isPending ? "Saving..." : "Save profile"}
            </Button>
          ) : undefined
        }
      />

      {locked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Business type is locked</p>
            <p className="mt-1 text-amber-800 dark:text-amber-300/90">
              Module provisioning was confirmed during onboarding. Contact a super admin to reprovision via change-business-type.
            </p>
          </div>
        </div>
      )}

      {!state?.completed && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
          Onboarding is not complete.{" "}
          <Link href="/onboarding" className="font-medium underline">
            Finish the onboarding wizard
          </Link>{" "}
          to activate modules for your workspace.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Business category</h2>
        <p className="mt-1 text-sm text-slate-500">Select the model that best matches how your organisation operates.</p>

        <div className="mt-4 grid gap-4">
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
                    : "border-slate-200 dark:border-slate-700"
                } ${locked || !isAdmin ? "opacity-90" : "hover:border-slate-300"}`}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left disabled:cursor-default"
                  disabled={locked || !isAdmin}
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
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Scope includes</p>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {BUSINESS_TYPE_SCOPE[type].slice(0, 8).map((item) => (
                          <li key={item} className="text-xs text-slate-600 dark:text-slate-400">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Subcategory</p>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRY_SUBTYPES[type].map((subtype) => (
                          <button
                            key={subtype}
                            type="button"
                            disabled={locked || !isAdmin}
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
                    {catalogType && (
                      <p className="text-xs text-slate-500">
                        Provisioning catalog: {catalogType.name}
                        {catalogType.subcategories.length
                          ? ` · ${catalogType.subcategories.length} subcategories configured`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Organisation profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Employee count</Label>
            <Select
              value={form.employeeCount}
              disabled={locked || !isAdmin}
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
              disabled={locked || !isAdmin}
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
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
          <Layers size={18} className="text-indigo-600" />
          {locked ? "Active ERP modules" : "Module provisioning preview"}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {locked
            ? "Modules and capabilities currently enabled for your tenant."
            : "Modules and capabilities that will be provisioned based on your selection."}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {preview.modules.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              {moduleLabel(key)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Capabilities</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {preview.submodules.map((key) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
            >
              <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
              {submoduleLabel(key)}
            </li>
          ))}
        </ul>
      </section>

      {workflowPreview.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Suggested workflows</h2>
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
        </section>
      )}

      {(profileView?.dashboardConfig?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Dashboard personalization</h2>
          <p className="mb-3 text-sm text-slate-500">
            {profileView?.dashboardConfig.filter((w) => w.visible).length} widgets configured for your business type.
          </p>
          <div className="flex flex-wrap gap-2">
            {profileView?.dashboardConfig
              .filter((w) => w.visible)
              .slice(0, 12)
              .map((w) => (
                <span
                  key={w.widgetCode}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  {w.widgetCode}
                </span>
              ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Current configuration</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium capitalize">{profileView?.provisioningStatus ?? "pending"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

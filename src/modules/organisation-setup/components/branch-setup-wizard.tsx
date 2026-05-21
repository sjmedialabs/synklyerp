"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBranchSchema } from "@/validators/organisation-setup";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/constants/geography";
import { getStatesForCountry, getCitiesForState } from "@/constants/geography";
import { BranchModuleSelector } from "@/modules/organisation-setup/components/branch-module-selector";
import type { BranchListItem } from "@/lib/organisation-setup/mappers";
import type { TenantModuleOption } from "@/lib/organisation-setup/module-availability";
import { useBranchSetupMutations } from "@/hooks/organisation-setup";

type FormData = z.infer<typeof createBranchSchema>;

const DESIGNATION_OPTIONS = [
  { value: "regular", title: "Regular Branch", description: "Standard operational branch" },
  { value: "primary", title: "Primary Office", description: "Main headquarters — only one per tenant" },
  { value: "corporate", title: "Corporate Office", description: "Corporate governance location" },
  { value: "primary_corporate", title: "Primary + Corporate", description: "Combined HQ and corporate office" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: BranchListItem | null;
  availableModules: TenantModuleOption[];
  hasPrimaryOffice?: boolean;
};

export function BranchSetupWizard({
  open,
  onClose,
  onSubmit,
  initial,
  availableModules,
  hasPrimaryOffice = false,
}: Props) {
  const [step, setStep] = useState(1);
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const { validateCode } = useBranchSetupMutations();
  const isEdit = !!initial;

  const defaultModules = useMemo(() => availableModules.map((m) => m.moduleCode), [availableModules]);
  const defaultSubmodules = useMemo(
    () => availableModules.flatMap((m) => m.submodules.map((s) => s.code)),
    [availableModules]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      branch_name: "",
      branch_code: "",
      country: "India",
      state: "",
      city: "",
      pincode: "",
      area: "",
      address: "",
      status: "active",
      designation: "regular",
      enabled_modules: defaultModules,
      enabled_submodules: defaultSubmodules,
    },
  });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setCodeStatus("idle");
    if (initial) {
      form.reset({
        branch_name: initial.branchName,
        branch_code: initial.branchCode,
        country: initial.country,
        state: initial.state,
        city: initial.city,
        pincode: initial.pincode ?? "",
        area: initial.area ?? "",
        address: initial.address ?? "",
        status: initial.status,
        designation: initial.designation,
        enabled_modules: initial.enabledModules.length ? initial.enabledModules : defaultModules,
        enabled_submodules: initial.enabledSubmodules.length ? initial.enabledSubmodules : defaultSubmodules,
      });
    } else {
      form.reset({
        branch_name: "",
        branch_code: "",
        country: "India",
        state: "",
        city: "",
        pincode: "",
        area: "",
        address: "",
        status: "active",
        designation: "regular",
        enabled_modules: defaultModules,
        enabled_submodules: defaultSubmodules,
      });
    }
  }, [open, initial, form, defaultModules, defaultSubmodules]);

  const country = form.watch("country");
  const state = form.watch("state");
  const branchCode = form.watch("branch_code");
  const designation = form.watch("designation");
  const enabledModules = form.watch("enabled_modules");
  const enabledSubmodules = form.watch("enabled_submodules");
  const states = getStatesForCountry(country);
  const cities = getCitiesForState(state);

  useEffect(() => {
    if (!branchCode || branchCode.length < 2) {
      setCodeStatus("idle");
      return;
    }
    const timer = setTimeout(async () => {
      setCodeStatus("checking");
      try {
        const result = await validateCode.mutateAsync({
          branch_code: branchCode,
          exclude_branch_id: initial?.id,
        });
        setCodeStatus(result.available ? "available" : "taken");
      } catch {
        setCodeStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchCode, initial?.id]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const primaryBlocked =
    hasPrimaryOffice &&
    (designation === "primary" || designation === "primary_corporate") &&
    !(isEdit && initial?.isPrimary);

  const nextFromStep1 = async () => {
    const ok = await form.trigger(["branch_name", "branch_code", "country", "state", "city", "pincode", "area"]);
    if (!ok || codeStatus === "taken") return;
    setStep(2);
  };

  const nextFromStep2 = async () => {
    if (primaryBlocked) return;
    const ok = await form.trigger(["status", "designation"]);
    if (!ok) return;
    setStep(3);
  };

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    handleClose();
  });

  const steps = ["Location", "Status", "Modules"];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Branch" : "Add Branch"}
      description={`Step ${step} of 3 — ${steps[step - 1]}`}
      size="lg"
    >
      <div className="mb-6 flex gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={`h-1 rounded-full ${i + 1 <= step ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
            />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Country *</Label>
                <Select {...form.register("country")} onChange={(e) => {
                  form.setValue("country", e.target.value);
                  form.setValue("state", "");
                  form.setValue("city", "");
                }}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>State *</Label>
                {states.length > 0 ? (
                  <Select {...form.register("state")} onChange={(e) => {
                    form.setValue("state", e.target.value);
                    form.setValue("city", "");
                  }}>
                    <option value="">Select state</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                ) : (
                  <Input {...form.register("state")} />
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City *</Label>
                {cities.length > 0 ? (
                  <Select {...form.register("city")}>
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                ) : (
                  <Input {...form.register("city")} />
                )}
              </div>
              <div>
                <Label>PIN Code *</Label>
                <Input {...form.register("pincode")} placeholder="500081" inputMode="numeric" />
                {form.formState.errors.pincode && (
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.pincode.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Location / Area *</Label>
              <Input {...form.register("area")} placeholder="e.g. HITEC City" />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea {...form.register("address")} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Branch Name *</Label>
                <Input {...form.register("branch_name")} placeholder="e.g. Hyderabad Main" />
              </div>
              <div>
                <Label>Branch Code *</Label>
                <Input {...form.register("branch_code")} placeholder="e.g. HYD-001" />
                {codeStatus === "checking" && <p className="mt-1 text-xs text-slate-500">Checking availability...</p>}
                {codeStatus === "available" && <p className="mt-1 text-xs text-emerald-600">Code is available</p>}
                {codeStatus === "taken" && <p className="mt-1 text-xs text-rose-600">Code already in use</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="font-medium">Branch Active</p>
                <p className="text-sm text-slate-500">Disabled branches are hidden from operations</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.watch("status") === "active"}
                  onChange={(e) => form.setValue("status", e.target.checked ? "active" : "inactive")}
                />
                <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div>
              <Label>Office Designation</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {DESIGNATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue("designation", opt.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      designation === opt.value
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <p className="font-medium">{opt.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{opt.description}</p>
                  </button>
                ))}
              </div>
              {primaryBlocked && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  A primary office already exists for this tenant. Choose Regular or Corporate, or edit the existing primary office.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <BranchModuleSelector
            modules={availableModules}
            enabledModules={enabledModules}
            enabledSubmodules={enabledSubmodules}
            onChange={(mods, subs) => {
              form.setValue("enabled_modules", mods);
              form.setValue("enabled_submodules", subs);
            }}
          />
        )}

        <div className="mt-6 flex justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={step === 1 ? handleClose : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={step === 1 ? nextFromStep1 : nextFromStep2}
              disabled={step === 2 && primaryBlocked}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : isEdit ? "Update Branch" : "Create Branch"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

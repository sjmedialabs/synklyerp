"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { branchSchema } from "@/validators/organisation";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OFFICE_TYPES, COUNTRIES, INDIAN_STATES } from "@/constants/organisation";
import type { Branch } from "@/lib/mappers/organisation";

type FormData = z.infer<typeof branchSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: Branch | null;
};

export function BranchWizard({ open, onClose, onSubmit, initial }: Props) {
  const [step, setStep] = useState(1);
  const isEdit = !!initial;

  const form = useForm<FormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      officeType: "None",
      country: "India",
      state: "",
      city: "",
      address: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (open && initial) {
      form.reset({
        name: initial.name,
        code: initial.code,
        description: initial.description ?? "",
        officeType: initial.officeType as FormData["officeType"],
        country: initial.country,
        state: initial.state,
        city: initial.city,
        address: initial.address ?? "",
        status: initial.status as FormData["status"],
      });
    } else if (open && !initial) {
      form.reset({
        name: "",
        code: "",
        description: "",
        officeType: "None",
        country: "India",
        state: "",
        city: "",
        address: "",
        status: "ACTIVE",
      });
    }
    setStep(1);
  }, [open, initial, form]);

  const country = form.watch("country");
  const states = INDIAN_STATES[country] ?? [];

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    handleClose();
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Branch" : "Add Branch"}
      description={`Step ${step} of 2`}
      size="lg"
    >
      <form onSubmit={submit}>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <Input {...form.register("name")} placeholder="Headquarters" />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label>Branch Code *</Label>
              <Input {...form.register("code")} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...form.register("description")} rows={2} />
            </div>
            <div>
              <Label>Office Type</Label>
              <Select {...form.register("officeType")}>
                {OFFICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Select {...form.register("country")}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>State *</Label>
                {states.length > 0 ? (
                  <Select {...form.register("state")}>
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
            <div>
              <Label>City *</Label>
              <Input {...form.register("city")} />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea {...form.register("address")} rows={2} />
            </div>
            <div>
              <Label>Status</Label>
              <Select {...form.register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={step === 1 ? handleClose : () => setStep(1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step === 1 ? (
            <Button type="button" className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setStep(2)}>
              Next
            </Button>
          ) : (
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

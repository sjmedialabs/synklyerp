"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { divisionSchema } from "@/validators/organisation";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ASSIGNABLE_MODULES } from "@/constants/organisation";
import type { Division } from "@/lib/mappers/organisation";
import { X } from "lucide-react";

type FormData = z.infer<typeof divisionSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: Division | null;
};

export function DivisionWizard({ open, onClose, onSubmit, initial }: Props) {
  const [step, setStep] = useState(1);
  const [modulePick, setModulePick] = useState("");
  const isEdit = !!initial;

  const form = useForm<FormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: { name: "", code: "", description: "", modulesAssigned: [], status: "ACTIVE" },
  });

  const modules = form.watch("modulesAssigned") ?? [];

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? "",
        code: initial?.code ?? "",
        description: initial?.description ?? "",
        modulesAssigned: initial?.modulesAssigned ?? [],
        status: (initial?.status as FormData["status"]) ?? "ACTIVE",
      });
      setStep(1);
    }
  }, [open, initial, form]);

  const addModule = () => {
    if (!modulePick || modules.includes(modulePick)) return;
    form.setValue("modulesAssigned", [...modules, modulePick]);
    setModulePick("");
  };

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Division" : "Add Division"} description={`Step ${step} of 2`} size="lg">
      <form onSubmit={submit}>
        {step === 1 ? (
          <div className="space-y-4">
            <div><Label>Division Name *</Label><Input {...form.register("name")} /></div>
            <div><Label>Division Code *</Label><Input {...form.register("code")} /></div>
            <div><Label>Description</Label><Textarea {...form.register("description")} rows={2} /></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={modulePick} onChange={(e) => setModulePick(e.target.value)} className="flex-1">
                <option value="">Select module</option>
                {ASSIGNABLE_MODULES.filter((m) => !modules.includes(m)).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <Button type="button" variant="outline" onClick={addModule}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <span key={m} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-800">
                  {m}
                  <button type="button" onClick={() => form.setValue("modulesAssigned", modules.filter((x) => x !== m))}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("modulesAssigned", [...ASSIGNABLE_MODULES])}>Select All</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("modulesAssigned", [])}>Deselect All</Button>
            </div>
            <div><Label>Status</Label><Select {...form.register("status")}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></div>
          </div>
        )}
        <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 1 ? "Cancel" : "Back"}</Button>
          {step === 1 ? (
            <Button type="button" className="bg-indigo-600 text-white" onClick={() => setStep(2)}>Next</Button>
          ) : (
            <Button type="submit" className="bg-indigo-600 text-white" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving..." : "Save"}</Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

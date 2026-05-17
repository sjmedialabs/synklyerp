"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgTaxSchema } from "@/validators/finance";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrgTax } from "@/lib/mappers/modules";

type FormData = z.infer<typeof orgTaxSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: OrgTax | null;
};

export function TaxDialog({ open, onClose, onSubmit, initial }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(orgTaxSchema),
    defaultValues: { name: "", rate: 0, type: "GST", status: "ACTIVE" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? "",
        rate: initial?.rate ?? 0,
        type: initial?.type ?? "GST",
        status: (initial?.status as FormData["status"]) ?? "ACTIVE",
      });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Tax" : "Add Tax"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Tax Name *</Label>
          <Input {...form.register("name")} />
        </div>
        <div>
          <Label>Rate (%) *</Label>
          <Input type="number" step="0.01" {...form.register("rate", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Type *</Label>
          <Input {...form.register("type")} placeholder="GST, VAT, TDS..." />
        </div>
        <div>
          <Label>Status</Label>
          <Select {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="bg-indigo-600 text-white" disabled={form.formState.isSubmitting}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

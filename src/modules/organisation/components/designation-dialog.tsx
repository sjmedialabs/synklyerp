"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { designationSchema } from "@/validators/organisation";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Designation } from "@/lib/mappers/organisation";

type FormData = z.infer<typeof designationSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: Designation | null;
};

export function DesignationDialog({ open, onClose, onSubmit, initial }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(designationSchema),
    defaultValues: { name: "", status: "ACTIVE" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: initial?.name ?? "", status: (initial?.status as FormData["status"]) ?? "ACTIVE" });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Designation" : "Add Designation"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Designation Name *</Label>
          <Input {...form.register("name")} />
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

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

type FormInput = z.input<typeof designationSchema>;
type FormOutput = z.infer<typeof designationSchema>;

const GRADE_OPTIONS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"];

const DEPARTMENT_SUGGESTIONS = [
  "Management",
  "Finance",
  "Human Resources",
  "Sales",
  "Marketing",
  "Operations",
  "Engineering",
  "IT",
  "Legal",
  "Customer Support",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormOutput) => Promise<void>;
  initial?: Designation | null;
  designationOptions?: Pick<Designation, "id" | "name">[];
};

export function DesignationDialog({ open, onClose, onSubmit, initial, designationOptions = [] }: Props) {
  const form = useForm<FormInput>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      name: "",
      status: "ACTIVE",
      department: "",
      gradeLevel: "",
      reportsToDesignationId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? "",
        status: (initial?.status as FormInput["status"]) ?? "ACTIVE",
        department: initial?.department ?? "",
        gradeLevel: initial?.gradeLevel ?? "",
        reportsToDesignationId: initial?.reportsToDesignationId ?? "",
      });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (data) => {
    const parsed = designationSchema.parse(data);
    await onSubmit(parsed);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Designation" : "Add Designation"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Designation Name *</Label>
          <Input {...form.register("name")} placeholder="e.g. Finance Manager" />
        </div>
        <div>
          <Label>Department</Label>
          <Input {...form.register("department")} list="designation-departments" placeholder="e.g. Finance" />
          <datalist id="designation-departments">
            {DEPARTMENT_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>Grade Level</Label>
          <Select {...form.register("gradeLevel")}>
            <option value="">Select grade</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Reports To</Label>
          <Select {...form.register("reportsToDesignationId")}>
            <option value="">None</option>
            {designationOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-indigo-600 text-white" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

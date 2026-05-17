"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema } from "@/validators/hr";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBranches, useDivisions, useDesignations } from "@/hooks/organisation";
import type { Employee } from "@/lib/mappers/modules";

type FormData = z.infer<typeof employeeSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: Employee | null;
};

export function EmployeeFormDialog({ open, onClose, onSubmit, initial }: Props) {
  const { data: branches = [] } = useBranches();
  const { data: divisions = [] } = useDivisions();
  const { data: designations = [] } = useDesignations();

  const form = useForm<FormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      dateOfJoining: new Date().toISOString().slice(0, 10),
      designationId: "",
      department: "",
      branchId: "",
      divisionId: "",
      employmentType: "Full-time",
      status: "Active",
      workEmail: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: initial?.fullName ?? "",
        dateOfJoining: initial?.dateOfJoining?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        designationId: initial?.designationId ?? "",
        department: initial?.department ?? "",
        branchId: initial?.branchId ?? "",
        divisionId: initial?.divisionId ?? "",
        employmentType: initial?.employmentType ?? "Full-time",
        status: initial?.status ?? "Active",
        workEmail: initial?.workEmail ?? "",
        personalEmail: initial?.personalEmail ?? "",
        phoneNumber: initial?.phoneNumber ?? "",
        emergencyContact: initial?.emergencyContact ?? "",
        reportingToId: initial?.reportingToId ?? "",
      });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Employee" : "Add Employee"} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Full Name *</Label>
          <Input {...form.register("fullName")} />
        </div>
        <div>
          <Label>Date of Joining *</Label>
          <Input type="date" {...form.register("dateOfJoining")} />
        </div>
        <div>
          <Label>Employment Type *</Label>
          <Select {...form.register("employmentType")}>
            <option value="Full-time">Full Time</option>
            <option value="Part-time">Part Time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </Select>
        </div>
        <div>
          <Label>Designation *</Label>
          <Select {...form.register("designationId")}>
            <option value="">Select...</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Input {...form.register("department")} />
        </div>
        <div>
          <Label>Branch *</Label>
          <Select {...form.register("branchId")}>
            <option value="">Select...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Division *</Label>
          <Select {...form.register("divisionId")}>
            <option value="">Select...</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Work Email</Label>
          <Input type="email" {...form.register("workEmail")} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...form.register("phoneNumber")} />
        </div>
        <div>
          <Label>Status *</Label>
          <Select {...form.register("status")}>
            <option value="Active">Active</option>
            <option value="On Probation">On Probation</option>
            <option value="Inactive">Inactive</option>
            <option value="Terminated">Terminated</option>
          </Select>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="bg-indigo-600 text-white" disabled={form.formState.isSubmitting}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

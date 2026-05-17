"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgUserSchema } from "@/validators/organisation";
import type { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { OrgUser } from "@/lib/mappers/organisation";
import type { Branch } from "@/lib/mappers/organisation";
import type { Designation } from "@/lib/mappers/organisation";

type FormData = z.infer<typeof orgUserSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initial?: OrgUser | null;
  branches: Branch[];
  designations: Designation[];
  roles: { id: string; name: string }[];
};

export function UserFormDialog({ open, onClose, onSubmit, initial, branches, designations, roles }: Props) {
  const isEdit = !!initial;

  const form = useForm<FormData>({
    resolver: zodResolver(orgUserSchema),
    defaultValues: {
      name: "",
      email: "",
      userCode: "",
      password: "",
      designationId: "",
      department: "",
      branchId: "",
      roleId: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        userCode: initial?.userCode ?? "",
        password: "",
        designationId: initial?.designationId ?? "",
        department: initial?.department ?? "",
        branchId: initial?.branchId ?? "",
        roleId: initial?.roleId ?? "",
        status: (initial?.status as FormData["status"]) ?? "ACTIVE",
      });
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (data) => {
    if (!isEdit && !data.password) {
      form.setError("password", { message: "Password required" });
      return;
    }
    await onSubmit(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit User" : "Add User"} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Name *</Label><Input {...form.register("name")} /></div>
        <div><Label>Email *</Label><Input type="email" {...form.register("email")} /></div>
        <div><Label>User Code</Label><Input {...form.register("userCode")} /></div>
        {!isEdit && (
          <div className="sm:col-span-2"><Label>Password *</Label><Input type="password" {...form.register("password")} /></div>
        )}
        <div><Label>Designation</Label>
          <Select {...form.register("designationId")}>
            <option value="">—</option>
            {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div><Label>Branch</Label>
          <Select {...form.register("branchId")}>
            <option value="">—</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <div><Label>Department</Label><Input {...form.register("department")} /></div>
        <div><Label>Role</Label>
          <Select {...form.register("roleId")}>
            <option value="">—</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
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

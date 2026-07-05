"use client";

import { LEAD_STATUSES } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { Lead } from "@/lib/mappers/modules";

type Props = {
  open: boolean;
  editing: Lead | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function LeadFormModal({ open, editing, onClose, onSubmit }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Lead" : "New Lead"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Contact name *</Label>
          <Input name="name" defaultValue={editing?.name} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Company</Label>
            <Input name="company" defaultValue={editing?.company ?? ""} />
          </div>
          <div>
            <Label>Lead type *</Label>
            <Input name="leadType" defaultValue={editing?.leadType ?? "INBOUND"} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={editing?.email ?? ""} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input name="phone" defaultValue={editing?.phone ?? ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Source</Label>
            <Input name="source" defaultValue={editing?.source ?? ""} disabled={!!editing?.originalSource} />
            {editing?.originalSource && (
              <p className="mt-1 text-xs text-slate-500">Original source is immutable: {editing.originalSource}</p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select name="status" defaultValue={editing?.status ?? "FRESH_LEAD"}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Input name="notes" defaultValue={editing?.notes ?? ""} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-indigo-600 text-white">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

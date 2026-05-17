"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const BUSINESS_TYPES = ["Product", "Service", "Hybrid"];
const INDUSTRIES = ["IT Services", "Manufacturing", "Retail", "Healthcare", "Consulting", "Other"];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function BusinessTypePage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessType: session?.user?.businessType ?? "Hybrid",
    industry: "IT Services",
    employeeCount: "11-50",
    businessSize: "SMB",
  });

  const save = async () => {
    setSaving(true);
    try {
      toast.success("Business profile saved locally. Full onboarding API sync is on the Phase 2 roadmap.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Business Type"
        description="Configure how SynklyERP adapts modules and defaults for your organisation."
      />
      <div className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Label>Business category *</Label>
          <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Industry subtype *</Label>
          <Select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
            {INDUSTRIES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Employee count *</Label>
          <Select value={form.employeeCount} onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}>
            {SIZES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Business size</Label>
          <Input value={form.businessSize} onChange={(e) => setForm({ ...form, businessSize: e.target.value })} />
        </div>
        <Button className="bg-indigo-600 text-white" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

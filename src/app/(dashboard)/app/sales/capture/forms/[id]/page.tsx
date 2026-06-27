"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

type FormField = {
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  mapToLeadField?: string;
  sortOrder: number;
};

type FormDetail = {
  form: {
    id: string;
    name: string;
    status: string;
    embedToken: string;
    successMessage: string | null;
    redirectUrl: string | null;
    spamProtection: string;
    viewCount: number;
    submissionCount: number;
  };
  fields: FormField[];
};

const FIELD_TYPES = ["text", "email", "phone", "textarea", "dropdown", "checkbox", "date", "number"];

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.id as string;
  const [data, setData] = useState<FormDetail | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/capture/forms/${formId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message);
        setData(json.data);
        setFields(json.data.fields ?? []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [formId]);

  const embedUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${data?.form.embedToken}` : "";
  const apiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1/public/forms/${data?.form.embedToken}/submit` : "";

  const saveFields = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/capture/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      toast.success("Form fields saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    const res = await fetch(`/api/sales/capture/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    const json = await res.json();
    if (json.success) toast.success("Form published");
    else toast.error(json.error?.message);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading form...
      </div>
    );
  }

  if (!data) return <p className="text-sm text-rose-600">Form not found</p>;

  return (
    <div className="space-y-6">
      <Link href="/app/sales/capture" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft size={14} /> Back to Capture Hub
      </Link>

      <PageHeader
        title={data.form.name}
        description="Configure fields, embed code, and submission settings."
        badge={
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{data.form.status}</span>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={publish}>
              Publish
            </Button>
            <Button className="bg-indigo-600 text-white" onClick={saveFields} disabled={saving}>
              {saving ? "Saving..." : "Save fields"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Form fields</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFields((f) => [
                  ...f,
                  { fieldKey: `field_${f.length + 1}`, label: "New field", fieldType: "text", required: false, sortOrder: f.length },
                ])
              }
            >
              <Plus size={14} className="mr-1" /> Add field
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={`${field.fieldKey}-${i}`} className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-4 dark:border-slate-800">
                <Input
                  value={field.label}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...field, label: e.target.value };
                    setFields(next);
                  }}
                  placeholder="Label"
                />
                <Input
                  value={field.fieldKey}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...field, fieldKey: e.target.value };
                    setFields(next);
                  }}
                  placeholder="Key"
                />
                <Select
                  value={field.fieldType}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...field, fieldType: e.target.value };
                    setFields(next);
                  }}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => {
                        const next = [...fields];
                        next[i] = { ...field, required: e.target.checked };
                        setFields(next);
                      }}
                    />
                    Required
                  </label>
                  <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => setFields(fields.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">Analytics</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Views</dt>
                <dd>{data.form.viewCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Submissions</dt>
                <dd>{data.form.submissionCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Conversion</dt>
                <dd>
                  {data.form.viewCount > 0
                    ? `${Math.round((data.form.submissionCount / data.form.viewCount) * 100)}%`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
            <h2 className="text-sm font-semibold">Embed & API</h2>
            <div className="mt-2 space-y-2 text-xs">
              <div>
                <Label>Direct link</Label>
                <div className="mt-1 flex gap-1">
                  <Input readOnly value={embedUrl} className="text-xs" />
                  <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(embedUrl); toast.success("Copied"); }}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div>
                <Label>REST endpoint</Label>
                <code className="mt-1 block break-all rounded bg-white p-2 dark:bg-slate-900">{apiUrl}</code>
              </div>
              <div>
                <Label>Embed iframe</Label>
                <code className="mt-1 block break-all rounded bg-white p-2 dark:bg-slate-900">{`<iframe src="${embedUrl}" width="100%" height="520" frameborder="0"></iframe>`}</code>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

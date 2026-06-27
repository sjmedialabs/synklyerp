"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type PublicField = { key: string; label: string; type: string; required: boolean };

export default function PublicFormPage() {
  const params = useParams();
  const token = params.token as string;
  const [fields, setFields] = useState<PublicField[]>([]);
  const [formName, setFormName] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/v1/public/forms/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message);
        setFormName(json.data.name);
        setFields(json.data.fields ?? []);
      })
      .catch(() => setSuccessMessage("This form is unavailable."))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/public/forms/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, _hp: "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setSuccessMessage(json.data.message);
      if (json.data.redirectUrl) window.location.href = json.data.redirectUrl;
    } catch (err) {
      setSuccessMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (successMessage && fields.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-600">{successMessage}</p>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="font-medium text-emerald-900">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{formName}</h1>
        <p className="mt-1 text-sm text-slate-500">Fill in your details and we&apos;ll be in touch.</p>
        <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label>
                {field.label}
                {field.required && " *"}
              </Label>
              {field.type === "textarea" ? (
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required={field.required}
                  rows={4}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              ) : (
                <Input
                  type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                  required={field.required}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>

        <Button type="submit" className="mt-6 w-full bg-indigo-600 text-white" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

export default function SuperAdminAuthSettingsPage() {
  const [otpSignupEnabled, setOtpSignupEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/superadmin/settings/auth")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOtpSignupEnabled(Boolean(json.data?.otpSignupEnabled));
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/settings/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otpSignupEnabled }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Save failed");
      toast.success("Auth settings updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Authentication Settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Control how new users register on the public signup page.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-semibold text-slate-900">OTP signup</Label>
            <p className="mt-1 text-sm text-slate-600">
              When enabled, users must verify both email and mobile with OTP codes during signup.
              When disabled, users register with a single form and verify their official email via a
              verification link before signing in.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={otpSignupEnabled}
            onClick={() => setOtpSignupEnabled((v) => !v)}
            disabled={loading}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              otpSignupEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                otpSignupEnabled ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <strong className="text-slate-800">Current mode:</strong>{" "}
          {otpSignupEnabled ? "OTP verification (email + mobile)" : "Basic registration (email link)"}
        </div>

        <Button type="button" className="mt-4" disabled={loading || saving} onClick={save}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

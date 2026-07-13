"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          setStatus("error");
          return;
        }
        setEmail(json.data?.email ?? null);
        setStatus("success");
        toast.success("Email verified successfully");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const continueWithLogin = () => {
    window.location.href = email ? `/login?email=${encodeURIComponent(email)}&verified=1` : "/login?verified=1";
  };

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirm your official email to access SynklyERP."
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-[#1B1538] hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 py-8 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm">Verifying your email...</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Your email is verified</p>
          <p>
            {email ? (
              <>
                <strong>{email}</strong> is now confirmed. Sign in to start onboarding.
              </>
            ) : (
              "Sign in to start onboarding."
            )}
          </p>
          <Button
            type="button"
            onClick={continueWithLogin}
            className="h-10 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            Continue to sign in
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-medium">Verification link invalid or expired</p>
          <p>Request a new link from the signup page or contact support if the problem persists.</p>
          <Button asChild variant="outline" className="h-10 w-full rounded-full">
            <Link href="/signup">Back to signup</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Mail, Lock, Smartphone } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { TurnstileWidget } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { bootstrapAuthSession, completeAuthRedirect } from "@/lib/auth/client";
import { useOtpResend } from "@/hooks/auth/use-otp-resend";

type IdentifierKind = "email" | "phone" | null;

function detectIdentifierKind(value: string): IdentifierKind {
  const v = value.trim();
  if (!v) return null;
  if (v.includes("@")) return "email";
  const digits = v.replace(/\D/g, "");
  if (digits.length >= 6 || /^\+/.test(v) || (/^\d/.test(v) && !/[a-zA-Z]/.test(v))) {
    return "phone";
  }
  return null;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [devHint, setDevHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const { seconds, canResend, startCooldown } = useOtpResend();

  const kind = useMemo(() => detectIdentifierKind(identifier), [identifier]);

  const resetOtp = () => {
    setOtpSent(false);
    setOtp("");
    setDevHint("");
    setCaptchaToken("");
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    resetOtp();
  };

  const sendOtp = async (phone: string) => {
    if (!phone.trim()) {
      toast.error("Enter your mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "sms",
          identifier: phone.trim(),
          purpose: "login",
          captchaToken: captchaToken || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to send OTP");
      setOtpSent(true);
      if (json.data?.devCode) setDevHint(json.data.devCode);
      startCooldown(json.data?.resendAfterSeconds ?? json.error?.details?.retryAfterSeconds ?? 60);
      toast.success("Verification code sent via SMS");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = async () => {
    await bootstrapAuthSession(rememberMe);
    await completeAuthRedirect();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) {
      toast.error("Enter a valid email or mobile number");
      return;
    }

    setLoading(true);
    try {
      if (kind === "email") {
        const res = await signIn("credentials", {
          email: identifier.trim().toLowerCase(),
          password,
          rememberMe: String(rememberMe),
          redirect: false,
        });
        if (res?.error) {
          toast.error("Invalid email or password, or account temporarily locked");
          return;
        }
        await finishLogin();
        return;
      }

      const phone = identifier.trim().replace(/\s/g, "");
      if (!otpSent) {
        await sendOtp(phone);
        return;
      }

      const res = await signIn("credentials", {
        phone,
        otp,
        channel: "sms",
        rememberMe: String(rememberMe),
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid or expired code");
        return;
      }
      await finishLogin();
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    kind === "email" ? "Sign in" : otpSent ? "Verify & sign in" : "Send verification code";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your work email or registered mobile number."
      footer={
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#1B1538] hover:underline">
            Create account
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>Email or mobile number</Label>
          <div className="relative mt-1.5">
            {kind === "phone" ? (
              <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            ) : (
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            )}
            <Input
              type="text"
              autoComplete="username"
              required
              placeholder="you@company.com or +91 98765 43210"
              className="pl-10"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
            />
          </div>
        </div>

        {kind === "email" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#1B1538] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        {kind === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <p className="text-sm text-slate-600">
                We&apos;ll send a one-time code to this number to sign you in.
              </p>
            ) : (
              <>
                <OtpInput value={otp} onChange={setOtp} label="Verification code" />
                {devHint && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Dev mode OTP: <strong>{devHint}</strong>
                  </p>
                )}
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-[#1B1538] disabled:opacity-50"
                  onClick={() => sendOtp(identifier.trim().replace(/\s/g, ""))}
                  disabled={loading || !canResend}
                >
                  {canResend ? "Resend code" : `Resend in ${seconds}s`}
                </button>
              </>
            )}
          </div>
        )}

        {(kind === "phone" && !otpSent) || kind === "email" ? (
          <TurnstileWidget onToken={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300"
          />
          Remember me for 30 days
        </label>

        <Button
          type="submit"
          disabled={loading || !kind}
          className="h-11 w-full rounded-full text-white"
          style={{ backgroundColor: "#1B1538" }}
        >
          {loading ? "Please wait..." : submitLabel}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Demo: admin@synklydemo.io / Synkly@2026!
      </p>
    </AuthShell>
  );
}


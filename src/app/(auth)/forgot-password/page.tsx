"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { TurnstileWidget } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { useOtpResend } from "@/hooks/auth/use-otp-resend";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const { seconds, canResend, startCooldown } = useOtpResend();

  const sendOtp = async () => {
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          identifier: email,
          purpose: "reset",
          captchaToken: captchaToken || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to send code");
      setStep("reset");
      if (json.data?.devCode) setDevHint(json.data.devCode);
      startCooldown(json.data?.resendAfterSeconds ?? 60);
      toast.success("Reset code sent to your email");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = evaluatePassword(password);
    if (!pw.valid) {
      toast.error(pw.hints[0] ?? pw.message);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Reset failed");
      toast.success("Password updated. You can sign in now.");
      router.push("/login");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a one-time code to set a new password."
      footer={
        <p className="text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-[#1B1538] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {step === "email" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <div>
            <Label>Work email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="you@company.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <TurnstileWidget onToken={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Sending..." : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={resetPassword}>
          <p className="text-sm text-slate-600">
            Code sent to <span className="font-medium text-slate-900">{email}</span>
          </p>
          <OtpInput value={otp} onChange={setOtp} label="Reset code" />
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-[#1B1538] disabled:opacity-50"
            disabled={loading || !canResend}
            onClick={sendOtp}
          >
            {canResend ? "Resend code" : `Resend in ${seconds}s`}
          </button>
          {devHint && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Dev mode OTP: <strong>{devHint}</strong>
            </p>
          )}
          <div>
            <Label>New password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <PasswordStrengthMeter password={password} />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Updating..." : "Set new password"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-slate-500 hover:text-[#1B1538]"
            onClick={() => setStep("email")}
          >
            ← Use a different email
          </button>
        </form>
      )}
    </AuthShell>
  );
}

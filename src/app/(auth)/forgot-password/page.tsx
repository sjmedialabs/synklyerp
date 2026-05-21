"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { TurnstileWidget, captchaEnabled } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { useOtpResend } from "@/hooks/auth/use-otp-resend";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const { seconds, canResend, startCooldown } = useOtpResend();

  const captchaRequired = captchaEnabled();
  const captchaOk = !captchaRequired || !!captchaToken;
  const passwordCheck = useMemo(() => evaluatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const resetValid = otp.length === 6 && passwordCheck.valid && passwordsMatch;

  const sendOtp = async () => {
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    if (captchaRequired && !captchaToken) {
      toast.error("Complete the CAPTCHA verification");
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
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.hints[0] ?? passwordCheck.message);
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
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
      toast.success("Password reset successfully");
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
      subtitle={
        step === "email"
          ? "We'll email you a one-time code to set a new password."
          : "Enter a new password to continue"
      }
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
                autoFocus
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
            disabled={loading || !email || !captchaOk}
            className="h-11 w-full rounded-full text-white disabled:opacity-50"
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
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                minLength={8}
                placeholder="Enter new password"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>
          <div>
            <Label>Confirm password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Confirm new password"
                className={`pl-10 pr-10 ${confirmPassword && !passwordsMatch ? "border-red-400" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !resetValid}
            className="h-11 w-full rounded-full text-white disabled:opacity-50"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Updating..." : "Reset Password"}
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

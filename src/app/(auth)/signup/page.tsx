"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Building2, Mail, Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { TurnstileWidget, captchaEnabled } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { bootstrapAuthSession, completeAuthRedirect } from "@/lib/auth/client";
import { useOtpResend } from "@/hooks/auth/use-otp-resend";

type SignupStep = "form" | "verify" | "check-email";

type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceCents: number;
  trialDays: number;
};

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>("form");
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [planSlug, setPlanSlug] = useState("");
  const [otpSignupEnabled, setOtpSignupEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [smsOtp, setSmsOtp] = useState("");
  const [devEmailHint, setDevEmailHint] = useState("");
  const [devSmsHint, setDevSmsHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { seconds, canResend, startCooldown } = useOtpResend();
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    password: "",
  });

  const captchaRequired = captchaEnabled();
  const captchaOk = !captchaRequired || !!captchaToken;
  const passwordCheck = useMemo(() => evaluatePassword(form.password), [form.password]);

  const formValid =
    !!form.companyName.trim() &&
    !!form.email.trim() &&
    !!form.phone.trim() &&
    passwordCheck.valid &&
    captchaOk &&
    !!planSlug;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("plan");
    Promise.all([fetch("/api/public/plans"), fetch("/api/public/auth-settings")])
      .then(async ([plansRes, settingsRes]) => {
        const plansJson = await plansRes.json();
        const settingsJson = await settingsRes.json();
        if (settingsJson.success) {
          setOtpSignupEnabled(Boolean(settingsJson.data?.otpSignupEnabled));
        }
        if (plansJson.success && plansJson.data?.length) {
          setPlans(plansJson.data);
          if (fromUrl && plansJson.data.some((p: PublicPlan) => p.slug === fromUrl)) {
            setPlanSlug(fromUrl);
          } else {
            setPlanSlug(plansJson.data[0]?.slug ?? "starter");
          }
        } else {
          setPlanSlug(fromUrl ?? "starter");
        }
      })
      .catch(() => setPlanSlug(fromUrl ?? "starter"));
  }, []);

  const sendOtps = async () => {
    if (!formValid) {
      toast.error(passwordCheck.hints[0] ?? passwordCheck.message ?? "Fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        purpose: "signup",
        captchaToken: captchaToken || undefined,
      };

      const [emailRes, smsRes] = await Promise.all([
        fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, channel: "email", identifier: form.email }),
        }),
        fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, channel: "sms", identifier: form.phone }),
        }),
      ]);

      const emailJson = await emailRes.json();
      const smsJson = await smsRes.json();
      if (!emailJson.success) throw new Error(emailJson.error?.message ?? "Failed to send email code");
      if (!smsJson.success) throw new Error(smsJson.error?.message ?? "Failed to send mobile code");

      setStep("verify");
      if (emailJson.data?.devCode) setDevEmailHint(emailJson.data.devCode);
      if (smsJson.data?.devCode) setDevSmsHint(smsJson.data.devCode);
      startCooldown(emailJson.data?.resendAfterSeconds ?? 60);
      toast.success("Verification codes sent to your email and mobile");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const registerBasic = async () => {
    if (!formValid) {
      toast.error(passwordCheck.hints[0] ?? passwordCheck.message ?? "Fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, planSlug }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Signup failed");
      setStep("check-email");
      toast.success("Check your email to verify your account");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const completeOtpSignup = async () => {
    if (emailOtp.length !== 6 || smsOtp.length !== 6) {
      toast.error("Enter both verification codes");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          planSlug,
          emailOtp,
          smsOtp,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Signup failed");

      const login = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        rememberMe: "false",
        redirect: false,
      });
      if (login?.error) {
        toast.success("Account created. Sign in to continue.");
        window.location.href = "/login";
        return;
      }

      await bootstrapAuthSession(false);
      toast.success("Account verified. Setting up your workspace...");
      await completeAuthRedirect();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSignupEnabled) sendOtps();
    else registerBasic();
  };

  const planOptions = plans.length
    ? plans
    : [{ slug: "starter", name: "Starter", description: null, monthlyPriceCents: 0, trialDays: 14, id: "" }];

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        otpSignupEnabled
          ? "Register with your official email and mobile. We'll verify both with OTP."
          : "Register with your official email and mobile. Verify your email to start onboarding."
      }
      footer={
        <p className="text-center text-sm text-slate-600">
          Have an account?{" "}
          <Link href="/login" className="font-semibold text-[#1B1538] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {step === "form" && (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <Label className="text-xs">Plan</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {planOptions.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setPlanSlug(p.slug)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    planSlug === p.slug
                      ? "border-[#1B1538] bg-[#1B1538]/5 text-[#1B1538]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {p.name}
                  {p.monthlyPriceCents > 0
                    ? ` · ₹${(p.monthlyPriceCents / 100).toLocaleString("en-IN")}/mo`
                    : " · Free"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Company name</Label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                required
                autoFocus
                placeholder="Acme Corp"
                className="h-10 pl-10"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Official email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="h-10 pl-10"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Mobile number</Label>
              <div className="relative mt-1">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="h-10 pl-10"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="h-10 pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
            <PasswordStrengthMeter password={form.password} />
          </div>

          <TurnstileWidget onToken={setCaptchaToken} onExpire={() => setCaptchaToken("")} />

          <Button
            type="submit"
            disabled={loading || !formValid}
            className="h-10 w-full rounded-full text-white disabled:opacity-50"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading
              ? otpSignupEnabled
                ? "Sending codes..."
                : "Creating account..."
              : otpSignupEnabled
                ? "Send verification codes"
                : "Create account"}
          </Button>
        </form>
      )}

      {step === "verify" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Enter the codes sent to <strong>{form.email}</strong> and <strong>{form.phone}</strong>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Email code</Label>
              <OtpInput value={emailOtp} onChange={setEmailOtp} />
            </div>
            <div>
              <Label className="text-xs">Mobile code</Label>
              <OtpInput value={smsOtp} onChange={setSmsOtp} />
            </div>
          </div>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-[#1B1538] disabled:opacity-50"
            disabled={loading || !canResend}
            onClick={sendOtps}
          >
            {canResend ? "Resend codes" : `Resend in ${seconds}s`}
          </button>
          {(devEmailHint || devSmsHint) && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Dev OTP — Email: <strong>{devEmailHint || "—"}</strong> · Mobile:{" "}
              <strong>{devSmsHint || "—"}</strong>
            </p>
          )}
          <Button
            type="button"
            disabled={loading || emailOtp.length !== 6 || smsOtp.length !== 6}
            onClick={completeOtpSignup}
            className="h-10 w-full rounded-full text-white disabled:opacity-50"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Creating account..." : "Verify & create account"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-slate-500 hover:text-[#1B1538]"
            onClick={() => {
              setStep("form");
              setEmailOtp("");
              setSmsOtp("");
            }}
          >
            ← Back
          </button>
        </div>
      )}

      {step === "check-email" && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Verify your official email</p>
          <p>
            We sent a verification link to <strong>{form.email}</strong>. Open it to activate your
            account, then sign in to begin onboarding.
          </p>
          <Button asChild className="h-10 w-full rounded-full" style={{ backgroundColor: "#1B1538" }}>
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

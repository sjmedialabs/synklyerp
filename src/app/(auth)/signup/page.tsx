"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, User, Mail, Smartphone, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { TurnstileWidget } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { useOtpResend } from "@/hooks/auth/use-otp-resend";

type SignupChannel = "email" | "sms";
type SignupStep = "plan" | "details" | "verify";

type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceCents: number;
  features: string[];
  trialDays: number;
};

export default function SignupPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<SignupChannel>("email");
  const [step, setStep] = useState<SignupStep>("plan");
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [planSlug, setPlanSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [devHint, setDevHint] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const { seconds, canResend, startCooldown } = useOtpResend();
  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const identifier = channel === "email" ? form.email : form.phone;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("plan");
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length) {
          setPlans(json.data);
          if (fromUrl && json.data.some((p: PublicPlan) => p.slug === fromUrl)) {
            setPlanSlug(fromUrl);
          } else {
            setPlanSlug(json.data[0]?.slug ?? "starter");
          }
        } else {
          setPlanSlug(fromUrl ?? "starter");
        }
      })
      .catch(() => setPlanSlug(fromUrl ?? "starter"));
  }, []);

  const sendOtp = async () => {
    if (!planSlug) {
      toast.error("Select a subscription plan");
      return;
    }
    if (!form.companyName || !form.fullName || !form.email || !form.password) {
      toast.error("Fill in all required fields");
      return;
    }
    if (channel === "sms" && !form.phone) {
      toast.error("Enter your mobile number");
      return;
    }
    const pw = evaluatePassword(form.password);
    if (!pw.valid) {
      toast.error(pw.hints[0] ?? pw.message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier, purpose: "signup", captchaToken: captchaToken || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed to send OTP");
      setStep("verify");
      if (json.data?.devCode) setDevHint(json.data.devCode);
      startCooldown(json.data?.resendAfterSeconds ?? 60);
      toast.success(channel === "email" ? "Verification code sent to your email" : "Code sent via SMS");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, channel, otp, planSlug }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Signup failed");
      toast.success("Account created. Sign in to continue.");
      router.push("/login");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: SignupChannel; label: string }[] = [
    { id: "email", label: "Email OTP" },
    { id: "sms", label: "Mobile OTP" },
  ];

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start your SynklyERP trial with email or mobile verification."
      footer={
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#1B1538] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {step !== "plan" && (
      <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={step === "verify"}
            onClick={() => {
              setChannel(t.id);
              setOtp("");
              setDevHint("");
            }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition sm:text-sm ${
              channel === t.id ? "bg-white text-[#1B1538] shadow-sm" : "text-slate-500 hover:text-slate-700"
            } disabled:opacity-60`}
          >
            {t.label}
          </button>
        ))}
      </div>
      )}

      {step === "plan" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Choose a plan to get started. You can change it later.</p>
          <div className="grid gap-3">
            {(plans.length ? plans : [{ slug: "starter", name: "Starter", description: "Default plan", monthlyPriceCents: 0, features: [], trialDays: 14, id: "" }]).map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setPlanSlug(p.slug)}
                className={`rounded-xl border p-4 text-left transition ${
                  planSlug === p.slug ? "border-[#1B1538] bg-[#1B1538]/5 ring-2 ring-[#1B1538]/20" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="text-sm text-slate-600">
                    {p.monthlyPriceCents > 0 ? `₹${(p.monthlyPriceCents / 100).toLocaleString("en-IN")}/mo` : "Free"}
                  </span>
                </div>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                {p.trialDays > 0 && <p className="mt-2 text-xs text-indigo-600">{p.trialDays}-day trial</p>}
              </button>
            ))}
          </div>
          <Button
            type="button"
            disabled={!planSlug}
            onClick={() => setStep("details")}
            className="h-11 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            Continue
          </Button>
        </div>
      ) : step === "details" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <div>
            <Label>Company name</Label>
            <div className="relative mt-1.5">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                required
                placeholder="Acme Pvt Ltd"
                className="pl-10"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Your full name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                required
                placeholder="Jane Doe"
                className="pl-10"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Work email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                required
                placeholder="you@company.com"
                className="pl-10"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Mobile number {channel === "sms" ? "" : "(optional)"}</Label>
            <div className="relative mt-1.5">
              <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="tel"
                required={channel === "sms"}
                placeholder="+91 98765 43210"
                className="pl-10"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="pl-10"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <PasswordStrengthMeter password={form.password} />
          </div>

          <TurnstileWidget onToken={setCaptchaToken} onExpire={() => setCaptchaToken("")} />

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Sending code..." : `Send ${channel === "email" ? "email" : "mobile"} verification code`}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Enter the code sent to <span className="font-medium text-slate-900">{identifier}</span>
          </p>
          <OtpInput value={otp} onChange={setOtp} />
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
          <Button
            type="button"
            disabled={loading}
            onClick={completeSignup}
            className="h-11 w-full rounded-full text-white"
            style={{ backgroundColor: "#1B1538" }}
          >
            {loading ? "Creating account..." : "Verify & create account"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-slate-500 hover:text-[#1B1538]"
            onClick={() => {
              setStep("plan");
              setOtp("");
            }}
          >
            ← Back to details
          </button>
        </div>
      )}
    </AuthShell>
  );
}

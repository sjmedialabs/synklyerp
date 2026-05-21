"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Smartphone, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { TurnstileWidget, captchaEnabled } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { bootstrapAuthSession, completeAuthRedirect } from "@/lib/auth/client";

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

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email or mobile number is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
  return null;
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid mobile number (e.g. +91 9876543210)";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return null;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string; captcha?: string }>({});
  const [formError, setFormError] = useState("");

  const kind = useMemo(() => detectIdentifierKind(identifier), [identifier]);
  const captchaRequired = captchaEnabled();
  const captchaOk = !captchaRequired || !!captchaToken;

  const identifierError = useMemo(() => {
    if (!identifier.trim()) return null;
    return kind === "email" ? validateEmail(identifier) : kind === "phone" ? validatePhone(identifier) : "Enter a valid email or mobile number";
  }, [identifier, kind]);

  const passwordError = useMemo(() => (password ? validatePassword(password) : null), [password]);

  const canSubmit =
    !!kind &&
    !identifierError &&
    !!password &&
    !passwordError &&
    captchaOk &&
    !loading;

  const clearErrorsOnChange = () => {
    setFieldErrors({});
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof fieldErrors = {};
    if (!kind) nextErrors.identifier = "Enter a valid email or mobile number";
    else if (kind === "email" && validateEmail(identifier)) nextErrors.identifier = validateEmail(identifier)!;
    else if (kind === "phone" && validatePhone(identifier)) nextErrors.identifier = validatePhone(identifier)!;

    const pwErr = validatePassword(password);
    if (pwErr) nextErrors.password = pwErr;
    if (captchaRequired && !captchaToken) nextErrors.captcha = "Complete the CAPTCHA verification";

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    setFormError("");
    try {
      const res =
        kind === "email"
          ? await signIn("credentials", {
              email: identifier.trim().toLowerCase(),
              password,
              rememberMe: String(rememberMe),
              redirect: false,
            })
          : await signIn("credentials", {
              phone: identifier.trim().replace(/\s/g, ""),
              password,
              rememberMe: String(rememberMe),
              redirect: false,
            });
      if (res?.error) {
        setFormError("Invalid credentials or account temporarily locked");
        return;
      }

      await bootstrapAuthSession(rememberMe);
      await completeAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your dashboard"
      footer={
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#1B1538] hover:underline">
            Create one free
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="identifier">Email or mobile number</Label>
          <div className="relative mt-1.5">
            {kind === "phone" ? (
              <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            ) : (
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            )}
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              autoFocus
              required
              placeholder="Email or +91 mobile"
              className={`pl-10 ${fieldErrors.identifier || identifierError ? "border-red-400" : ""}`}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                clearErrorsOnChange();
              }}
            />
          </div>
          {(fieldErrors.identifier || identifierError) && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.identifier ?? identifierError}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-[#1B1538] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Your password"
              className={`pl-10 pr-10 ${fieldErrors.password || passwordError ? "border-red-400" : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearErrorsOnChange();
              }}
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
          {(fieldErrors.password || passwordError) && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password ?? passwordError}</p>
          )}
        </div>

        <div>
          <TurnstileWidget
            onToken={(token) => {
              setCaptchaToken(token);
              setFieldErrors((prev) => ({ ...prev, captcha: undefined }));
            }}
            onExpire={() => setCaptchaToken("")}
          />
          {fieldErrors.captcha && <p className="mt-1 text-xs text-red-600">{fieldErrors.captcha}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300"
          />
          Remember me for 30 days
        </label>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-full text-white disabled:opacity-50"
          style={{ backgroundColor: "#1B1538" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthShell>
  );
}

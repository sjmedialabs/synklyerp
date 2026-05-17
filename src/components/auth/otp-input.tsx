"use client";

import { Input, Label } from "@/components/ui/input";

type OtpInputProps = {
  value: string;
  onChange: (v: string) => void;
  label?: string;
};

export function OtpInput({ value, onChange, label = "Verification code" }: OtpInputProps) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="6-digit code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="mt-1.5 text-center text-lg tracking-[0.3em]"
      />
    </div>
  );
}

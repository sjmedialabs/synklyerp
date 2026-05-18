"use client";

import { useMemo } from "react";
import { evaluatePassword, type PasswordStrength } from "@/lib/auth/password-policy";

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: "bg-red-500",
  fair: "bg-amber-500",
  good: "bg-lime-500",
  strong: "bg-emerald-500",
};

const STRENGTH_WIDTH: Record<PasswordStrength, string> = {
  weak: "w-1/4",
  fair: "w-2/4",
  good: "w-3/4",
  strong: "w-full",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const check = useMemo(() => evaluatePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLOR[check.strength]} ${STRENGTH_WIDTH[check.strength]}`}
        />
      </div>
      <p className="text-xs capitalize text-slate-500">
        Strength: <span className="font-medium text-slate-700">{check.strength}</span>
      </p>
      {check.hints.length > 0 && (
        <ul className="list-inside list-disc text-xs text-slate-500">
          {check.hints.slice(0, 2).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

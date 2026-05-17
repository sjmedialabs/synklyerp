"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import type { ReactNode } from "react";

const BRAND_NAVY = "#1B1538";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white" style={{ fontFamily: "var(--font-google-sans)" }}>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-[#1B1538]"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to website
        </Link>

        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-6 flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
              style={{ backgroundColor: BRAND_NAVY }}
            >
              S
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: BRAND_NAVY }}>
              SynklyERP
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>

          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-slate-200 pt-6">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block" style={{ backgroundColor: BRAND_NAVY }}>
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80"
          alt="Enterprise team"
          fill
          className="object-cover opacity-40"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B1538] via-[#1B1538]/90 to-violet-900/80" />
        <div className="relative z-10 flex h-full flex-col justify-center p-12 xl:p-16">
          <p className="text-sm font-medium uppercase tracking-widest text-violet-300">Enterprise platform</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
            One platform to organise, manage &amp; scale your business.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ShieldCheck, title: "Bank-grade security", text: "Tenant isolation and encrypted credentials." },
              { icon: Lock, title: "OTP sign-in", text: "Email and mobile one-time passwords supported." },
            ].map((item) => (
              <li key={item.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-violet-200/90">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

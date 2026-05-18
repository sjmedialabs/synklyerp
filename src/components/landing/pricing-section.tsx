"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "./data";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-20 lg:py-28" style={{ backgroundColor: "#F8F7FC" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1B1538] sm:text-4xl">
            Plans that scale with your business
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Start with a 14-day trial. Upgrade when you are ready — no credit card required to explore.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${
                plan.highlighted
                  ? "border-[#1B1538] shadow-md ring-2 ring-[#1B1538]/10"
                  : "border-slate-200"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1B1538] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-[#1B1538]">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1B1538]">{plan.price}</span>
                {plan.price !== "Custom" && (
                  <span className="text-sm text-slate-500">/ {plan.period}</span>
                )}
              </div>
              {plan.price === "Custom" && (
                <p className="mt-1 text-sm text-slate-500">{plan.period}</p>
              )}
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check size={16} className="mt-0.5 shrink-0 text-violet-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-[#1B1538] text-white hover:bg-[#2a2160]"
                    : "border-2 border-[#1B1538] text-[#1B1538] hover:bg-[#1B1538] hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Star, ChevronLeft, ChevronRight, Play } from "lucide-react";
import {
  NAV_LINKS,
  TRUST_LOGOS,
  PLATFORM_MODULES,
  QUICK_ACTIONS,
  HIGHLIGHT_TABS,
  ENTERPRISE_FEATURES,
  STATS,
  TESTIMONIALS,
  REVIEWS,
  FOOTER_COLUMNS,
} from "./data";
import { FeatureMock } from "./ui-mockups";
import { PricingSection } from "./pricing-section";
import { StickyCta } from "./sticky-cta";

const BRAND_NAVY = "#1B1538";
const BRAND_LAVENDER = "#E8E4F5";

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tab = HIGHLIGHT_TABS[activeTab];
  const testimonial = TESTIMONIALS[testimonialIdx];
  const onDarkHeader = !scrolled;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased" style={{ fontFamily: "var(--font-google-sans)" }}>
      {/* Navigation */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-[#1B1538]/85 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold ${
                onDarkHeader ? "bg-white text-[#1B1538]" : "bg-[#1B1538] text-white"
              }`}
            >
              S
            </div>
            <span className={`text-xl font-bold tracking-tight ${onDarkHeader ? "text-white" : "text-[#1B1538]"}`}>
              SynklyERP
            </span>
          </Link>

          <nav
            className={`hidden items-center gap-8 text-sm font-medium lg:flex ${
              onDarkHeader ? "text-white/90" : "text-slate-600"
            }`}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`transition ${onDarkHeader ? "hover:text-white" : "hover:text-[#1B1538]"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/login"
              className={`text-sm font-medium transition ${
                onDarkHeader ? "text-white/90 hover:text-white" : "text-slate-700 hover:text-[#1B1538]"
              }`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                onDarkHeader
                  ? "bg-white text-[#1B1538] hover:bg-violet-100"
                  : "bg-[#1B1538] text-white hover:bg-[#2a2160]"
              }`}
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            className={`lg:hidden ${onDarkHeader ? "text-white" : "text-slate-900"}`}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white lg:hidden"
          >
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-bold">SynklyERP</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col gap-4 p-6 text-lg font-medium">
              {NAV_LINKS.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <Link href="/signup" className="mt-4 rounded-full bg-[#1B1538] py-3 text-center text-white">
                Sign up
              </Link>
              <Link href="/login" className="mt-2 py-3 text-center text-slate-600">
                Log in
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 lg:grid lg:grid-cols-2 lg:pt-0">
        <div className="flex flex-col justify-center px-6 py-16 lg:min-h-[90vh] lg:px-12 lg:py-24 xl:px-20" style={{ backgroundColor: BRAND_NAVY }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-4 text-sm font-medium text-violet-300">The global platform for modern enterprises.</p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Organise, manage, pay &amp; scale your business, anywhere.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-violet-200/90">
              SynklyERP unifies HR, Finance, Organisation, Sales, and Projects in one multi-tenant platform — built on real PostgreSQL, ready for enterprise scale.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#1B1538] shadow-lg transition hover:bg-violet-50"
            >
              Start free trial
            </Link>
          </motion.div>
        </div>
        <div className="relative min-h-[320px] lg:min-h-[90vh]">
          <Image
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80"
            alt="Team collaborating in a modern office"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B1538]/40 to-transparent lg:hidden" />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {TRUST_LOGOS.map((name) => (
              <span key={name} className="text-lg font-bold text-slate-300 transition hover:text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Platform grid */}
      <section id="platform" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1B1538] sm:text-4xl">
            The global business platform
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-600">
            Everything you need to run product, service, and hybrid organisations — with live modules backed by Supabase.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_MODULES.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-lg"
              >
                <h3 className="text-lg font-bold text-[#1B1538]">{mod.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{mod.description}</p>
                <FeatureMock type={mod.mock} />
                <Link
                  href={mod.href}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-violet-700 group-hover:text-violet-900"
                >
                  Explore <ArrowRight size={14} className="ml-1 transition group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise features strip */}
      <section id="solutions" className="py-16" style={{ backgroundColor: BRAND_LAVENDER }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-[#1B1538] sm:text-3xl">Enterprise-grade platform capabilities</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTERPRISE_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-xl bg-white/80 p-5 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1B1538] text-white">
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B1538]">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accomplish more */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-[#1B1538] sm:text-4xl">Accomplish more in less time</h2>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group rounded-2xl border border-slate-200 p-6 transition hover:border-violet-300 hover:bg-violet-50/50"
            >
              <a.icon className="mx-auto h-8 w-8 text-violet-600" />
              <p className="mt-3 font-semibold text-[#1B1538]">{a.label}</p>
              <p className="mt-1 text-xs text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Dark highlight tabs */}
      <section className="overflow-hidden py-20 lg:py-28" style={{ backgroundColor: BRAND_NAVY }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            One modern headquarters for your entire company
          </h2>
          <div className="mt-12 flex flex-col gap-10 lg:flex-row">
            <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {HIGHLIGHT_TABS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition lg:text-left ${
                    activeTab === i
                      ? "bg-white text-[#1B1538]"
                      : "text-violet-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[16/10]"
                >
                  <Image src={tab.image} alt={tab.label} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B1538]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white lg:p-8">
                    <h3 className="text-xl font-bold lg:text-2xl">{tab.headline}</h3>
                    <p className="mt-2 max-w-md text-sm text-violet-200">{tab.body}</p>
                  </div>
                  {tab.currencies && (
                    <div className="absolute right-4 top-4 flex flex-wrap gap-2">
                      {tab.currencies.map((c) => (
                        <span key={c} className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1B1538] shadow">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="customers" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#1B1538]">Our customers believe</h2>
          <div className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl bg-slate-50 p-8 lg:p-12">
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
                <Image src={testimonial.image} alt={testimonial.author} fill className="object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg leading-relaxed text-slate-700">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 font-semibold text-[#1B1538]">{testimonial.author}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
                <p className="mt-2 text-sm font-bold text-slate-400">{testimonial.company}</p>
              </div>
              <button
                type="button"
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1B1538] text-white shadow-lg"
                aria-label="Play video"
              >
                <Play size={20} fill="currentColor" />
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="rounded-full border p-2 hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialIdx(i)}
                    className={`h-2 w-2 rounded-full ${i === testimonialIdx ? "bg-[#1B1538]" : "bg-slate-300"}`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
                className="rounded-full border p-2 hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold text-[#1B1538] md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="inline-flex rounded-full border-2 border-[#1B1538] px-8 py-3 font-semibold text-[#1B1538] transition hover:bg-[#1B1538] hover:text-white"
            >
              View our product
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="resources" className="py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.platform} className="rounded-2xl border border-slate-200 p-6 text-center">
              <div className="flex justify-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="mt-2 text-sm font-bold text-[#1B1538]">{r.platform}</p>
              <p className="mt-1 text-lg font-bold">{r.rating}</p>
              <p className="mt-3 text-sm text-slate-600">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <PricingSection />

      <section className="py-20" style={{ backgroundColor: BRAND_LAVENDER }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-[#1B1538] sm:text-4xl">Ready to unify your enterprise?</h2>
          <p className="mt-4 text-lg text-slate-600">
            Join teams who run HR, Finance, and Sales from one secure workspace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-[#1B1538] px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#2a2160]"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-full border-2 border-[#1B1538] px-10 py-4 text-lg font-semibold text-[#1B1538] transition hover:bg-[#1B1538] hover:text-white"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <StickyCta />

      {/* Footer */}
      <footer id="about" className="py-16 text-white" style={{ backgroundColor: BRAND_NAVY }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#1B1538]">S</div>
                <span className="text-lg font-bold">SynklyERP</span>
              </div>
              <p className="mt-4 text-sm text-violet-300">The operating system for modern enterprises.</p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2 text-sm text-violet-300">
                  {col.links.map((link) => {
                    const label = typeof link === "string" ? link : link.label;
                    const href = typeof link === "string" ? "/login" : link.href;
                    return (
                      <li key={label}>
                        <Link href={href} className="hover:text-white">
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-violet-400 md:flex-row">
            <p>© {new Date().getFullYear()} SynklyERP, Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/login" className="hover:text-white">Privacy</Link>
              <Link href="/login" className="hover:text-white">Terms</Link>
              <Link href="/login" className="hover:text-white">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

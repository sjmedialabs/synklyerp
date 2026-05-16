"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, BarChart3, Users, Building2, LayoutTemplate, ShieldCheck, Zap, Globe, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Active Businesses", value: "12,000+" },
  { label: "Transactions Processed", value: "₹2.3B+" },
  { label: "Global Reach", value: "40+ Countries" },
  { label: "Uptime SLA", value: "99.99%" },
];

const modules = [
  { icon: Users, title: "Human Resources", desc: "Manage employees, attendance, and payroll efficiently." },
  { icon: BarChart3, title: "Finance & Accounting", desc: "Track expenses, automate invoicing, and monitor budgets." },
  { icon: Building2, title: "Organisation Setup", desc: "Structure branches, divisions, and designations seamlessly." },
  { icon: LayoutTemplate, title: "Project Management", desc: "Keep track of projects, tasks, and resource allocation." },
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent ${isScrolled ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">S</div>
              <span className="font-bold text-xl tracking-tight">Synkly<span className="text-indigo-600 dark:text-indigo-400">ERP</span></span>
            </div>
            
            <nav className="hidden md:flex gap-8 items-center font-medium text-sm text-slate-600 dark:text-slate-300">
              <Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link>
              <Link href="#modules" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Modules</Link>
              <Link href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link>
              <Link href="#customers" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Customers</Link>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
                <Link href="/login">Start Free Trial</Link>
              </Button>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 border border-indigo-200 dark:border-indigo-800/50">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" /> Platform version 2.0 is live
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              The operating system for <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">modern enterprises</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10">
              A unified, multi-tenant ERP platform managing HR, Finance, Projects, and CRM seamlessly. Built for scale, designed for speed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 w-full sm:w-auto shadow-lg shadow-indigo-600/25">
                <Link href="/login">Start 14-Day Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
                <Link href="#modules">Explore Modules</Link>
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-6 items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck size={18} className="text-emerald-500" /> SOC 2 Certified</span>
              <span className="flex items-center gap-1.5"><Zap size={18} className="text-amber-500" /> 99.99% SLA</span>
              <span className="flex items-center gap-1.5"><Globe size={18} className="text-blue-500" /> GDPR Compliant</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-200 dark:divide-slate-800 text-center">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{stat.value}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Showcase */}
      <section id="modules" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to run your business</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">SynklyERP brings your entire organization into a single, cohesive interface. Stop switching context and start building workflows.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, i) => {
              const Icon = module.icon;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{module.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{module.desc}</p>
                  <Link href="/login" className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                    Learn more <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 overflow-hidden bg-slate-900 dark:bg-slate-950">
        <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-600/5 mix-blend-multiply" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Ready to streamline your enterprise?</h2>
          <p className="text-xl text-slate-300 mb-10">Join thousands of businesses scaling faster with SynklyERP.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg h-14 px-10 text-lg">
              <Link href="/login">Start your free trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white">SynklyERP</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 SynklyERP, Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

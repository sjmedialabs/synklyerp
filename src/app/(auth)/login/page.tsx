"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Panel - Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 relative z-10">
        <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to website
        </Link>

        <div className="w-full max-w-sm mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center lg:text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-600/20 mb-6 mx-auto lg:mx-0">S</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your SynklyERP workspace.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg mb-8">
              <button 
                onClick={() => setAuthMode("password")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === "password" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Password
              </button>
              <button 
                onClick={() => setAuthMode("otp")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === "otp" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Email OTP
              </button>
            </div>

            <form className="space-y-5" onSubmit={async (e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              
              if (authMode === "password") {
                const res = await signIn("credentials", {
                  email,
                  password,
                  callbackUrl: "/app"
                });
                if (res?.error) {
                  alert("Invalid credentials. Please try again.");
                }
              }
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block">Work Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="email" type="email" required placeholder="name@company.com" className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white" />
                </div>
              </div>

              {authMode === "password" && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block">Password</label>
                    <Link href="#" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="password" type="password" required placeholder="••••••••" className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white" />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                {authMode === "password" ? "Sign In" : "Send One-Time Password"}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Don't have an account? <Link href="/onboarding" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Start your free trial</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Graphic */}
      <div className="hidden lg:flex relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-900/40 mix-blend-multiply" />
        <div className="absolute top-0 right-0 p-8 flex items-center gap-2 text-white/70 text-sm font-medium">
          <ShieldCheck size={18} className="text-emerald-400" /> Secure Enterprise Login
        </div>
        
        <div className="relative z-10 p-12 max-w-xl">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-bold text-white mb-6">One platform to sync your entire enterprise.</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1"><ShieldCheck size={16} className="text-emerald-400" /></div>
                <div>
                  <h4 className="text-white font-medium mb-1">Bank-grade Security</h4>
                  <p className="text-sm text-slate-300">Your data is isolated and encrypted at rest with strict SOC 2 compliance.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1"><Lock size={16} className="text-indigo-400" /></div>
                <div>
                  <h4 className="text-white font-medium mb-1">Multi-factor Authentication</h4>
                  <p className="text-sm text-slate-300">Support for hardware keys, TOTP, and SMS verification out of the box.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}

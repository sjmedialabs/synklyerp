"use client";

import { motion } from "framer-motion";
import { Users, Building2, CreditCard, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {
  const stats = [
    { label: "Total Tenants", value: "142", trend: "+12 this month", icon: Building2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Active Users", value: "8,439", trend: "+423 this week", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Monthly Recurring Revenue", value: "$42.5k", trend: "+12.5% vs last month", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "System Health", value: "99.99%", trend: "All systems operational", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SuperAdmin Portal</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage SynklyERP tenants, subscriptions, and platform settings.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white dark:bg-slate-900">Platform Logs</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Link href="/api/auth/signout">Sign Out</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">{stat.trend}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Tenant Registrations</h2>
            <div className="text-sm text-slate-500 text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              No recent registrations. Database connection established.
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
             <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
             <div className="space-y-3">
               <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manage Clients</span>
                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
               </button>
               <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Platform Settings</span>
                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
               </button>
               <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subscription Plans</span>
                 <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
               </button>
             </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

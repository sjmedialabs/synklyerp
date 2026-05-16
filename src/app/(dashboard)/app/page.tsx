"use client";

import { motion } from "framer-motion";
import { Users, Building2, Receipt, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const overviewCards = [
  { title: "Total Employees", value: "142", trend: "+4 this month", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { title: "Active Branches", value: "4", trend: "Across 2 countries", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { title: "Monthly Revenue", value: "₹4.2M", trend: "+12.5% vs last month", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { title: "Active Projects", value: "18", trend: "3 overdue", icon: Receipt, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back, John</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here's what's happening in your enterprise today.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
          Generate Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{card.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
              <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 h-8">
                View all
              </Button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users size={14} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">New employee onboarded</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sarah Jenkins was added to the Engineering division.</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{i + 1}h ago</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-6 text-white shadow-lg"
          >
            <h3 className="font-semibold mb-2">Complete your setup</h3>
            <p className="text-indigo-100 text-sm mb-4">You have 2 pending tasks to fully configure your ERP workspace.</p>
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-4">
              <div className="bg-white h-1.5 rounded-full w-2/3"></div>
            </div>
            <Button className="w-full bg-white text-indigo-700 hover:bg-slate-100">
              Continue Setup
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/app/hr/employees" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Add Employee</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/app/finance/services" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Create Invoice</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/app/organisation/branches" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Manage Branches</span>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

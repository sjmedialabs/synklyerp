"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-form";
import axios from "axios";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  basePrice: number;
  unit: string;
  status: string;
}

export default function ServicesHubPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("catalog");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await axios.get("/api/finance/services");
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newService: Partial<Service>) => axios.post("/api/finance/services", newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsModalOpen(false);
    }
  });

  const filteredServices = services?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Services Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your service catalog, pricing rules, and SLA policies.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
          <Plus size={16} className="mr-2" /> New Service
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 custom-scrollbar">
        {["catalog", "pricing", "packages", "sla"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab === "catalog" && "Service Catalog"}
            {tab === "pricing" && "Pricing Rules"}
            {tab === "packages" && "Service Packages"}
            {tab === "sla" && "SLA & Policies"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "catalog" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Service Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Base Price</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading services...</td></tr>
                ) : filteredServices?.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No services found.</td></tr>
                ) : (
                  filteredServices?.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/25 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{service.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{service.category}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">₹{service.basePrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{service.unit}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Pending States for other tabs */}
      {activeTab !== "catalog" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Feature in development</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">The {activeTab} module is currently being built for Phase 2 deployment.</p>
        </motion.div>
      )}

      {/* Create Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Service</h2>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createMutation.mutate({
                    name: formData.get("name") as string,
                    category: formData.get("category") as string,
                    basePrice: parseFloat(formData.get("basePrice") as string),
                    unit: formData.get("unit") as string,
                  });
                }} 
                className="p-5 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">Service Name</label>
                  <input name="name" required className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">Category</label>
                  <select name="category" required className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white">
                    <option value="">Select category...</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Implementation">Implementation</option>
                    <option value="Subscription">Subscription</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">Base Price (₹)</label>
                    <input name="basePrice" type="number" min="0" required className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">Unit</label>
                    <input name="unit" placeholder="e.g. per hour, per user" required className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {createMutation.isPending ? "Creating..." : "Save Service"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

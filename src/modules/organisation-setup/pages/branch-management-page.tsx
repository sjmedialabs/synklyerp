"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Power,
  Eye,
  Trash2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BranchSetupWizard } from "@/modules/organisation-setup/components/branch-setup-wizard";
import { useBranchesSetup, useBranchSetupMutations } from "@/hooks/organisation-setup";
import type { BranchListItem } from "@/lib/organisation-setup/mappers";

const DESIGNATION_LABELS: Record<string, string> = {
  regular: "Regular",
  primary: "Primary",
  corporate: "Corporate",
  primary_corporate: "Primary + Corporate",
};

export default function OrganisationBranchesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BranchListItem | null>(null);
  const [viewing, setViewing] = useState<BranchListItem | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data, isLoading, error } = useBranchesSetup({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
    designation: designationFilter || undefined,
  });

  const { create, update, remove, toggleStatus } = useBranchSetupMutations();

  const branches = data?.data ?? [];
  const pagination = data?.pagination;
  const tenant = data?.tenant;
  const availableModules = data?.availableModules ?? [];

  const hasPrimaryOffice = data?.hasPrimaryOffice ?? false;

  const handleSubmit = async (payload: Parameters<typeof create.mutateAsync>[0]) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Branch updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Branch created");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      throw e;
    }
  };

  const handleToggle = async (branch: BranchListItem) => {
    try {
      await toggleStatus.mutateAsync({
        id: branch.id,
        status: branch.status === "active" ? "inactive" : "active",
      });
      toast.success(branch.status === "active" ? "Branch disabled" : "Branch enabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleDelete = async (branch: BranchListItem) => {
    if (!confirm(`Delete branch "${branch.branchName}"? This action is restricted and may affect linked data.`)) return;
    try {
      await remove.mutateAsync(branch.id);
      toast.success("Branch deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Org – Branches"
        description="Manage branch locations, operational status, and module access per branch."
        actions={
          isAdmin ? (
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> Add Branch
            </Button>
          ) : undefined
        }
      />

      {tenant && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            Tenant: <strong>{tenant.status}</strong>
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            Business: <strong>{tenant.businessType}</strong>
            {tenant.businessSubcategory ? ` · ${tenant.businessSubcategory}` : ""}
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Search branches..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="max-w-[140px]"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          value={designationFilter}
          onChange={(e) => {
            setDesignationFilter(e.target.value);
            setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="">All types</option>
          <option value="primary">Primary</option>
          <option value="corporate">Corporate</option>
          <option value="regular">Regular</option>
          <option value="primary_corporate">Primary + Corporate</option>
        </Select>
      </div>

      {isLoading && (
        <div className="flex gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading branches...
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      {!isLoading && branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-800">
          <Building2 className="mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No branches yet.</p>
          <p className="mt-1 text-sm text-slate-500">Create your first branch to configure locations and modules.</p>
          {isAdmin && (
            <Button
              className="mt-6 bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> Add Branch
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {["Branch Name", "Code", "Location", "City / State", "Status", "Type", "Modules", "Actions"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium">{b.branchName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.branchCode}</td>
                    <td className="px-4 py-3">{b.area ?? "—"}</td>
                    <td className="px-4 py-3">{[b.city, b.state].filter(Boolean).join(", ")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{DESIGNATION_LABELS[b.designation] ?? b.designation}</td>
                    <td className="px-4 py-3">{b.enabledModules.length}</td>
                    <td className="relative px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMenuOpen(menuOpen === b.id ? null : b.id)}
                        aria-label="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                      {menuOpen === b.id && (
                        <div className="absolute right-4 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => {
                              setViewing(b);
                              setMenuOpen(null);
                            }}
                          >
                            <Eye size={14} /> View Details
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                  setEditing(b);
                                  setOpen(true);
                                  setMenuOpen(null);
                                }}
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                  handleToggle(b);
                                  setMenuOpen(null);
                                }}
                              >
                                <Power size={14} /> {b.status === "active" ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => {
                                  handleDelete(b);
                                  setMenuOpen(null);
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} branches)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <BranchSetupWizard
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        availableModules={availableModules}
        hasPrimaryOffice={hasPrimaryOffice}
      />

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{viewing.branchName}</h3>
            <p className="text-sm text-slate-500">{viewing.branchCode}</p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="text-slate-500">Location</dt><dd>{viewing.area ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd>{[viewing.address, viewing.city, viewing.state, viewing.country].filter(Boolean).join(", ") || "—"}</dd></div>
              <div><dt className="text-slate-500">PIN</dt><dd>{viewing.pincode ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd>{viewing.status}</dd></div>
              <div><dt className="text-slate-500">Type</dt><dd>{DESIGNATION_LABELS[viewing.designation]}</dd></div>
              <div><dt className="text-slate-500">Modules</dt><dd>{viewing.enabledModules.join(", ") || "None"}</dd></div>
            </dl>
            <Button className="mt-6 w-full" variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

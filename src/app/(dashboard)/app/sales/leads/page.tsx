"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Filter, Loader2, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { LeadFormModal } from "@/components/sales/leads/lead-form-modal";
import { LeadStageTabs } from "@/components/sales/leads/lead-stage-tabs";
import { LeadsMobileCards } from "@/components/sales/leads/leads-mobile-cards";
import { LeadsTable, type SortField } from "@/components/sales/leads/leads-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useLeadDashboardCounts,
  useLeadDetail,
  useLeadMutations,
  useLeadsQuery,
} from "@/hooks/sales/crm";
import type { Lead } from "@/lib/mappers/modules";
import type { LeadStageTab } from "@/lib/sales/lead-stages";
import type { CrmLeadActivity } from "@/lib/mappers/crm";

const EMPTY_COUNTS = { all: 0, fresh: 0, prospects: 0, converted: 0, dropped: 0 };

function TableSkeleton() {
  return (
    <div className="hidden animate-pulse space-y-2 lg:block">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-slate-200/80" />
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Users className="mb-3 h-12 w-12 text-slate-300" />
      <p className="font-medium text-slate-700">
        {query ? "No leads match your search" : "No leads in this stage yet"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {query ? "Try different keywords or clear filters." : "Add a lead or connect a capture source."}
      </p>
    </div>
  );
}

export default function LeadsPage() {
  const [stage, setStage] = useState<LeadStageTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [leadType, setLeadType] = useState("");
  const [source, setSource] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, CrmLeadActivity[]>>({});

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stage, leadType, source, statusFilter]);

  const { data: counts = EMPTY_COUNTS, isLoading: countsLoading } = useLeadDashboardCounts();
  const { data: listResult, isLoading, isFetching, error } = useLeadsQuery({
    search: debouncedSearch || undefined,
    stage,
    status: statusFilter || undefined,
    leadType: leadType || undefined,
    source: source || undefined,
    page,
    limit: 25,
    sortBy,
    sortOrder,
  });

  const leads = listResult?.data ?? [];
  const meta = listResult?.meta;
  const { create, update, remove } = useLeadMutations();
  const { data: expandedDetail } = useLeadDetail(expandedId ?? "");

  useEffect(() => {
    if (expandedId && expandedDetail?.activities) {
      setActivitiesMap((prev) => ({ ...prev, [expandedId]: expandedDetail.activities }));
    }
  }, [expandedId, expandedDetail]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (leads.every((l) => selected.has(l.id))) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  };

  const bulkDelete = () => {
    if (!selected.size || !confirm(`Delete ${selected.size} lead(s)?`)) return;
    Promise.all([...selected].map((id) => remove.mutateAsync(id)))
      .then(() => {
        toast.success("Selected leads deleted");
        setSelected(new Set());
      })
      .catch((e) => toast.error((e as Error).message));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      company: (fd.get("company") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      leadType: (fd.get("leadType") as string) || "INBOUND",
      source: (fd.get("source") as string) || undefined,
      status: (fd.get("status") as string) || "FRESH_LEAD",
      notes: (fd.get("notes") as string) || undefined,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...body });
        toast.success("Lead updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Lead created");
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lead Management"
        description="Pipeline, assignments, source attribution, and conversion tracking."
        badge={
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {countsLoading ? "…" : `${counts.all} total`}
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Link href="/app/sales/capture">
              <Button variant="outline">Lead Capture Hub</Button>
            </Link>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={16} className="mr-2" /> New Lead
            </Button>
          </div>
        }
      />

      <LeadStageTabs active={stage} counts={counts} onChange={setStage} />

      <div className="sticky top-[52px] z-[5] space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search company, contact, email, phone, service…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search leads"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setShowFilters((v) => !v)}>
            <Filter size={16} className="mr-2" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
            <Select value={leadType} onChange={(e) => setLeadType(e.target.value)} aria-label="Filter by lead type">
              <option value="">All lead types</option>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="FRESH_LEAD">Fresh</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CONVERTED">Converted</option>
              <option value="DROPPED">Dropped</option>
            </Select>
            <Input
              placeholder="Source filter"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              aria-label="Filter by source"
            />
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-600">{selected.size} selected</span>
            <Button type="button" variant="outline" size="sm" onClick={bulkDelete}>
              Delete
            </Button>
            <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
              Export
            </Button>
          </div>
        )}
      </div>

      {isLoading && <TableSkeleton />}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Updating…
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      {!isLoading && leads.length === 0 ? (
        <EmptyState query={debouncedSearch} />
      ) : (
        !isLoading && (
          <>
            <LeadsTable
              leads={leads}
              selected={selected}
              expandedId={expandedId}
              sortBy={sortBy}
              sortOrder={sortOrder}
              activitiesMap={activitiesMap}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
              onSort={handleSort}
              onEdit={(lead) => {
                setEditing(lead);
                setOpen(true);
              }}
              onDelete={(id) => {
                if (confirm("Delete this lead?")) {
                  remove.mutate(id, { onSuccess: () => toast.success("Lead deleted") });
                }
              }}
            />
            <LeadsMobileCards
              leads={leads}
              selected={selected}
              onToggleSelect={toggleSelect}
              onEdit={(lead) => {
                setEditing(lead);
                setOpen(true);
              }}
              onDelete={(id) => {
                if (confirm("Delete this lead?")) {
                  remove.mutate(id, { onSuccess: () => toast.success("Lead deleted") });
                }
              }}
            />
          </>
        )
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {meta.page} of {meta.totalPages} · {meta.total} leads
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LeadFormModal
        open={open}
        editing={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={submit}
      />
    </div>
  );
}

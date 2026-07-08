"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccountManagerSelect } from "@/components/sales/leads/account-manager-select";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useCommunicationHistory } from "@/hooks/sales/crm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { CommunicationHistoryItem } from "@/repositories/sales/crm/communication-history";
import { cn } from "@/lib/utils";

const CHANNEL_TABS = [
  { id: "all", label: "All" },
  { id: "whatsapp", label: "Chats" },
  { id: "call", label: "Calls" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
] as const;

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "call") return <Phone size={14} className="text-emerald-600" />;
  if (channel === "sms") return <MessageSquare size={14} className="text-sky-600" />;
  if (channel === "email") return <Mail size={14} className="text-indigo-600" />;
  return <MessageCircle size={14} className="text-green-600" />;
}

function channelBadgeClass(channel: string) {
  if (channel === "call") return "bg-emerald-100 text-emerald-800";
  if (channel === "sms") return "bg-sky-100 text-sky-800";
  if (channel === "email") return "bg-indigo-100 text-indigo-800";
  return "bg-green-100 text-green-800";
}

function HistoryRow({ item }: { item: CommunicationHistoryItem }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
        {new Date(item.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <Link href={`/app/sales/leads/${item.leadId}`} className="font-medium text-indigo-600 hover:underline">
          {item.leadName}
        </Link>
        {item.leadCompany && <p className="text-xs text-slate-500">{item.leadCompany}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize", channelBadgeClass(item.channel))}>
          <ChannelIcon channel={item.channel} />
          {item.channel === "whatsapp" ? "Chat" : item.channel}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">
        <span className="capitalize">{item.action.replace(/_/g, " ")}</span>
        {item.detail && (
          <p className="mt-0.5 line-clamp-2 max-w-md text-xs text-slate-500">{item.detail}</p>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{item.userName ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{item.assigneeName ?? "Unassigned"}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`/app/sales/leads/${item.leadId}`} className="text-xs font-medium text-indigo-600 hover:underline">
          View lead
        </Link>
      </td>
    </tr>
  );
}

export default function CommunicationHistoryPage() {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("leadId");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  const [channel, setChannel] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setPage(1);
  }, [channel, debouncedSearch, assignedTo, dateFrom, dateTo, sortOrder, leadIdParam]);

  const { data, isLoading, isFetching, error } = useCommunicationHistory({
    channel,
    search: debouncedSearch || undefined,
    assignedTo: assignedTo ?? undefined,
    leadId: leadIdParam ?? undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortOrder,
    page,
    limit: 30,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  const title = useMemo(() => {
    if (leadIdParam) return "Lead contact history";
    return isAdmin ? "Contact history" : "My lead contact history";
  }, [leadIdParam, isAdmin]);

  const description = useMemo(() => {
    if (leadIdParam) return "All calls, SMS, email, and WhatsApp activity for this lead.";
    if (isAdmin) return "Full communication log across all leads. Filter by channel, account manager, or date.";
    return "Calls, SMS, email, and WhatsApp activity for leads assigned to you.";
  }, [leadIdParam, isAdmin]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {leadIdParam && (
            <Link
              href="/app/sales/leads/communication-history"
              className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft size={14} /> All contact history
            </Link>
          )}
          <PageHeader title={title} description={description} />
        </div>
        {!leadIdParam && (
          <Link href="/app/sales/leads">
            <Button variant="outline" size="sm">
              Back to leads
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setChannel(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              channel === tab.id ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search lead, company, phone…"
            className="pl-9"
          />
        </div>
        {isAdmin && !leadIdParam && (
          <AccountManagerSelect value={assignedTo} onChange={setAssignedTo} />
        )}
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
        <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
          <option value="desc">Latest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-red-600">{(error as Error).message}</p>
        ) : items.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-500">No contact history found for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date & time</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Account manager</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} records
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="mt-2 text-center text-xs text-slate-400">Updating…</p>
      )}
    </div>
  );
}

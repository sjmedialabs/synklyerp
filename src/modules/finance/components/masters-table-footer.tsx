"use client";

import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

type Props = {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function MastersTableFooter({
  from,
  to,
  total,
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: Props) {
  const pageNumbers = Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <p>
        Showing {from} to {to} of {total} entries
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            ‹
          </Button>
          {pageNumbers.map((n) => (
            <Button
              key={n}
              type="button"
              variant={n === page ? "default" : "outline"}
              size="sm"
              className={cn("min-w-8", n === page && "bg-slate-900 text-white")}
              onClick={() => onPageChange(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </Button>
        </div>
        <div className="w-28">
          <SearchableSelect
            placeholder="10 / page"
            value={String(limit)}
            onChange={(v) => v && onLimitChange(Number(v))}
            allowClear={false}
            options={[
              { value: "10", label: "10 / page" },
              { value: "25", label: "25 / page" },
              { value: "50", label: "50 / page" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SearchableSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type Props = {
  value: string | null;
  displayLabel?: string | null;
  onChange: (value: string | null) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  compact?: boolean;
  className?: string;
  onSearchChange?: (query: string) => void;
};

export function SearchableSelect({
  value,
  displayLabel,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  loading = false,
  disabled = false,
  allowClear = true,
  clearLabel = "Unassigned",
  compact = false,
  className,
  onSearchChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? displayLabel ?? (value ? "Selected" : null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return;
    }
    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const handleSearch = (query: string) => {
    setSearch(query);
    onSearchChange?.(query);
  };

  const filtered = onSearchChange
    ? options
    : options.filter((o) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q);
      });

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white text-left text-sm transition-colors hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50",
          compact ? "h-8 min-w-[140px] px-2.5 py-1" : "h-10 px-3 py-2",
          !label && "text-slate-400"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label ?? placeholder}</span>
        <ChevronDown size={compact ? 14 : 16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        menuStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
          >
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 pl-8 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
              {loading && (
                <li className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </li>
              )}
              {!loading && allowClear && (
                <li>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                      !value && "bg-indigo-50 font-medium text-indigo-700"
                    )}
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    {clearLabel}
                  </button>
                </li>
              )}
              {!loading &&
                filtered.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                        value === option.value && "bg-indigo-50 font-medium text-indigo-700"
                      )}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel && <span className="block truncate text-xs text-slate-500">{option.sublabel}</span>}
                    </button>
                  </li>
                ))}
              {!loading && filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-slate-500">No results found</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

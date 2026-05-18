"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (dismissed) return;
      setVisible(window.scrollY > 480);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-6 sm:inset-x-auto sm:right-6 sm:left-auto sm:max-w-md sm:rounded-2xl sm:border">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-800">
          <span className="hidden sm:inline">Ready to unify HR, Finance &amp; Sales? </span>
          <span className="text-[#1B1538]">Start your free trial</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/signup"
            className="rounded-full bg-[#1B1538] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a2160]"
          >
            Sign up free
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

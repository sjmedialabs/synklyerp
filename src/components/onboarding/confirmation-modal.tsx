"use client";

import { Button } from "@/components/ui/button";

type ConfirmationModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmationModal({ open, onCancel, onConfirm, loading }: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-setup-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 id="confirm-setup-title" className="text-lg font-semibold text-slate-900 dark:text-white">
          Confirm your setup
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This will configure your ERP environment automatically, including modules, dashboards, workflows, and
          permissions. This action locks your business profile after completion.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Edit selection
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Starting..." : "Confirm & Proceed"}
          </Button>
        </div>
      </div>
    </div>
  );
}

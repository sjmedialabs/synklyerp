import { Suspense } from "react";
import { ModuleUnavailableContent } from "./module-unavailable-content";

export default function ModuleUnavailablePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <ModuleUnavailableContent />
    </Suspense>
  );
}

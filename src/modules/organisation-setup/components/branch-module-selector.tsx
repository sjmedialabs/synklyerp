"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TenantModuleOption } from "@/lib/organisation-setup/module-availability";

type Props = {
  modules: TenantModuleOption[];
  enabledModules: string[];
  enabledSubmodules: string[];
  onChange: (modules: string[], submodules: string[]) => void;
};

export function BranchModuleSelector({ modules, enabledModules, enabledSubmodules, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const moduleSet = useMemo(() => new Set(enabledModules), [enabledModules]);
  const submoduleSet = useMemo(() => new Set(enabledSubmodules), [enabledSubmodules]);

  const toggleModule = (code: string, enabled: boolean) => {
    const nextModules = enabled
      ? [...enabledModules, code]
      : enabledModules.filter((m) => m !== code);
    const mod = modules.find((m) => m.moduleCode === code);
    let nextSubs = enabledSubmodules;
    if (!enabled && mod) {
      const subCodes = mod.submodules.map((s) => s.code);
      nextSubs = enabledSubmodules.filter((s) => !subCodes.includes(s));
    }
    onChange(nextModules, nextSubs);
  };

  const toggleSubmodule = (moduleCode: string, subCode: string, enabled: boolean) => {
    let nextModules = enabledModules;
    if (enabled && !moduleSet.has(moduleCode)) {
      nextModules = [...enabledModules, moduleCode];
    }
    const nextSubs = enabled
      ? [...enabledSubmodules, subCode]
      : enabledSubmodules.filter((s) => s !== subCode);
    onChange(nextModules, nextSubs);
  };

  const enableAll = () => {
    onChange(
      modules.map((m) => m.moduleCode),
      modules.flatMap((m) => m.submodules.map((s) => s.code))
    );
  };

  const disableAll = () => onChange([], []);

  const toggleExpand = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  if (!modules.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
        No modules are enabled for this tenant. Complete onboarding or enable modules at tenant level first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={enableAll}>
          Enable All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={disableAll}>
          Disable All
        </Button>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => {
          const isOn = moduleSet.has(mod.moduleCode);
          const isOpen = expanded[mod.moduleCode] ?? true;
          const activeSubs = mod.submodules.filter((s) => submoduleSet.has(s.code)).length;

          return (
            <div
              key={mod.moduleCode}
              className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="text-slate-400"
                  onClick={() => toggleExpand(mod.moduleCode)}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={(e) => toggleModule(mod.moduleCode, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{mod.label}</span>
                  <span className="text-xs text-slate-500">
                    {activeSubs}/{mod.submodules.length} submodules
                  </span>
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const subCodes = mod.submodules.map((s) => s.code);
                      onChange(
                        [...new Set([...enabledModules, mod.moduleCode])],
                        [...new Set([...enabledSubmodules, ...subCodes])]
                      );
                    }}
                  >
                    All ON
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const subCodes = new Set(mod.submodules.map((s) => s.code));
                      onChange(
                        enabledModules.filter((m) => m !== mod.moduleCode),
                        enabledSubmodules.filter((s) => !subCodes.has(s))
                      );
                    }}
                  >
                    All OFF
                  </Button>
                </div>
              </div>

              {isOpen && mod.submodules.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mod.submodules.map((sub) => (
                      <label key={sub.code} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={submoduleSet.has(sub.code)}
                          onChange={(e) => toggleSubmodule(mod.moduleCode, sub.code, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-slate-700 dark:text-slate-300">{sub.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BusinessTypeStep } from "@/components/onboarding/business-type-step";
import {
  useOnboardingBusinessTypes,
  useSaveOnboardingStep,
} from "@/hooks/onboarding/use-onboarding-flow";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/client";
import { useOnboardingStore } from "@/stores/onboarding-store";

type BusinessCategoryWithFeatures = {
  id: string;
  featurePreviews: { name: string; icon: string | null }[];
  subcategories: { name: string; icon: string | null }[];
};

export default function OnboardingBusinessTypePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const setSelection = useOnboardingStore((s) => s.setSelection);
  const setStep = useOnboardingStore((s) => s.setStep);
  const selection = useOnboardingStore((s) => s.selection);

  const { data: businessTypes = [], isLoading: typesLoading } = useOnboardingBusinessTypes();
  const { data: categoriesWithFeatures = [] } = useQuery({
    queryKey: ["business-categories"],
    queryFn: () => fetchApi<BusinessCategoryWithFeatures[]>("/api/business-categories"),
    staleTime: 300_000,
  });
  const saveStep = useSaveOnboardingStep();

  const [selectedId, setSelectedId] = useState<string | null>(selection.businessTypeId);
  const [saving, setSaving] = useState(false);

  const categoriesByType = useMemo(() => {
    const map: Record<string, { label: string; icon?: string | null }[]> = {};
    for (const type of categoriesWithFeatures) {
      const previews = type.featurePreviews?.length ? type.featurePreviews : type.subcategories;
      map[type.id] = previews.map((sub) => ({
        label: sub.name,
        icon: sub.icon,
      }));
    }
    return map;
  }, [categoriesWithFeatures]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSelection({
      businessTypeId: id,
      businessCategoryId: null,
      businessSpecializationId: null,
    });
  }, [setSelection]);

  const handleContinue = async () => {
    if (!selectedId) {
      toast.error("Select a business category to continue");
      return;
    }

    setSaving(true);
    try {
      await saveStep.mutateAsync({
        step: 1,
        businessTypeId: selectedId,
        businessCategoryId: null,
        businessSpecializationId: null,
      });
      setStep(1);
      router.push("/onboarding");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save selection");
    } finally {
      setSaving(false);
    }
  };

  if (typesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/25">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Choose your business category. We&apos;ll tailor modules, navigation, and dashboard to match your industry.
        </p>
      </header>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
        <BusinessTypeStep
          types={businessTypes}
          selectedId={selectedId}
          onSelect={handleSelect}
          categoriesByType={categoriesByType}
        />
      </div>

      <footer className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-gradient-to-t from-white via-white to-transparent py-4 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950">
        <Button
          size="lg"
          className="gap-2"
          disabled={!selectedId || saving}
          onClick={handleContinue}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>

      <p className="mt-4 text-center text-xs text-slate-400">
        Need help?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Contact support
        </Link>
      </p>
    </div>
  );
}

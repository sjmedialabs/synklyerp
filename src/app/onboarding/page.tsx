"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryStep } from "@/components/onboarding/category-step";
import { SubcategoryStep } from "@/components/onboarding/subcategory-step";
import { OrganizationStep } from "@/components/onboarding/organization-step";
import { ReviewStep } from "@/components/onboarding/review-step";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ConfirmationModal } from "@/components/onboarding/confirmation-modal";
import { ProvisioningLoader } from "@/components/onboarding/provisioning-loader";
import { OnboardingSuccess } from "@/components/onboarding/onboarding-success";
import {
  useCompleteOnboarding,
  useOnboardingBusinessTypes,
  useOnboardingCategories,
  useOnboardingSessionQuery,
  useOnboardingSpecializations,
  useSaveOnboardingStep,
} from "@/hooks/onboarding/use-onboarding-flow";
import { resolveOnboardingProvisioning } from "@/lib/modules/activation";
import { getBusinessConfigByLegacyKey } from "@/business-configs";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { organizationSetupSchema } from "@/validators/onboarding-session";
import type { BusinessType } from "@/constants/onboarding";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();

  const step = useOnboardingStore((s) => s.step);
  const selection = useOnboardingStore((s) => s.selection);
  const organization = useOnboardingStore((s) => s.organization);
  const employeeCount = useOnboardingStore((s) => s.employeeCount);
  const businessSize = useOnboardingStore((s) => s.businessSize);
  const setStep = useOnboardingStore((s) => s.setStep);
  const setSelection = useOnboardingStore((s) => s.setSelection);
  const setOrganization = useOnboardingStore((s) => s.setOrganization);
  const setEmployeeCount = useOnboardingStore((s) => s.setEmployeeCount);
  const setBusinessSize = useOnboardingStore((s) => s.setBusinessSize);
  const hydrateFromSession = useOnboardingStore((s) => s.hydrateFromSession);

  const { data: sessionData, isLoading: sessionLoading } = useOnboardingSessionQuery();
  const { data: businessTypes = [], isLoading: typesLoading } = useOnboardingBusinessTypes();
  const { data: categories = [], isLoading: categoriesLoading } = useOnboardingCategories(
    selection.businessTypeId
  );
  const { data: specializations = [], isLoading: specsLoading } = useOnboardingSpecializations(
    selection.businessCategoryId
  );

  const saveStep = useSaveOnboardingStep();
  const complete = useCompleteOnboarding();

  const [uiPhase, setUiPhase] = useState<"wizard" | "provisioning" | "success">("wizard");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ modules: number; submodules: number } | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const isWaiting = searchParams.get("waiting") === "1" || !isAdmin;

  useEffect(() => {
    if (sessionData?.session) {
      hydrateFromSession(sessionData.session);
    }
  }, [sessionData?.session, hydrateFromSession]);

  useEffect(() => {
    if (sessionData?.completed) {
      router.replace("/app");
    }
  }, [sessionData?.completed, router]);

  useEffect(() => {
    if (!isWaiting && !sessionLoading && step === 0 && !selection.businessTypeId) {
      router.replace("/onboarding/business-type");
    }
    if (step === 0 && selection.businessTypeId) {
      setStep(1);
    }
  }, [isWaiting, sessionLoading, step, selection.businessTypeId, router, setStep]);

  const selectedType = businessTypes.find((t) => t.id === selection.businessTypeId);
  const selectedCategory = categories.find((c) => c.id === selection.businessCategoryId);
  const selectedSpec = specializations.find((s) => s.id === selection.businessSpecializationId);

  const provisioning = useMemo(() => {
    if (!selectedType || !selectedCategory) {
      return { modules: [] as string[], submodules: [] as string[] };
    }
    const legacyType = (selectedType.legacyKey ?? selectedType.slug) as BusinessType;
    const legacySub = selectedCategory.legacyKey ?? selectedCategory.name;
    return resolveOnboardingProvisioning(legacyType, legacySub);
  }, [selectedType, selectedCategory]);

  const workflowPreview =
    getBusinessConfigByLegacyKey(selectedType?.legacyKey ?? "")?.workflows.map((w) => w.name) ?? [];

  const persistStep = useCallback(
    async (nextStep: number) => {
      await saveStep.mutateAsync({
        step: nextStep,
        businessTypeId: selection.businessTypeId,
        businessCategoryId: selection.businessCategoryId,
        businessSpecializationId: selection.businessSpecializationId,
        organization,
        employeeCount: employeeCount ?? undefined,
        businessSize: businessSize ?? undefined,
      });
    },
    [saveStep, selection, organization, employeeCount, businessSize]
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return !!selection.businessTypeId;
      case 1:
        return !!selection.businessCategoryId;
      case 2:
        return true;
      case 3:
        return (
          !!organization.companyName &&
          organization.companyName.length >= 2 &&
          !!employeeCount &&
          !!businessSize
        );
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, selection, specializations.length, organization.companyName, employeeCount, businessSize]);

  const next = async () => {
    if (!canContinue) {
      toast.error("Please complete the required fields before continuing");
      return;
    }

    if (step === 2 && specializations.length === 0) {
      setSelection({ businessSpecializationId: null });
    }

    try {
      const nextStep = Math.min(step + 1, TOTAL_STEPS - 1);
      await persistStep(nextStep);
      setStep(nextStep);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save progress");
    }
  };

  const back = () => {
    if (step === 1) {
      router.push("/onboarding/business-type");
      return;
    }
    const prev = Math.max(1, step - 1);
    setStep(prev);
    void persistStep(prev);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setUiPhase("provisioning");

    try {
      if (
        !selection.businessTypeId ||
        !selection.businessCategoryId ||
        !employeeCount ||
        !businessSize ||
        !organization.companyName
      ) {
        throw new Error("Incomplete onboarding data");
      }

      const orgParsed = organizationSetupSchema.parse({
        ...organization,
        companyName: organization.companyName,
        numberOfEmployees: employeeCount,
        businessSize,
      });

      const result = await complete.mutateAsync({
        businessTypeId: selection.businessTypeId,
        businessCategoryId: selection.businessCategoryId,
        businessSpecializationId: selection.businessSpecializationId,
        organization: orgParsed,
        employeeCount,
        businessSize,
        confirmation: true,
      });

      setProvisionResult({
        modules: result.enabledModules.length,
        submodules: result.enabledSubmodules.length,
      });

      await update();
      setUiPhase("success");
    } catch (e) {
      setUiPhase("wizard");
      toast.error(e instanceof Error ? e.message : "Confirmation failed");
    }
  };

  if (uiPhase === "provisioning") {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6">
        <ProvisioningLoader />
      </div>
    );
  }

  if (uiPhase === "success") {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6">
        <OnboardingSuccess
          moduleCount={provisionResult?.modules ?? provisioning.modules.length}
          submoduleCount={provisionResult?.submodules ?? provisioning.submodules.length}
        />
      </div>
    );
  }

  if (sessionLoading || typesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading onboarding...</p>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
          S
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace setup in progress</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Your organisation admin is completing the initial business setup. You&apos;ll get full dashboard access once
          onboarding is confirmed.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/25">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Set up {session?.user?.tenantName ?? "your workspace"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Configure your business profile once. We&apos;ll tailor modules, dashboard, and permissions automatically.
        </p>
      </header>

      <OnboardingProgress currentStep={step} />

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <CategoryStep
              key="category"
              categories={categories}
              selectedId={selection.businessCategoryId}
              onSelect={(id) =>
                setSelection({
                  businessCategoryId: id,
                  businessSpecializationId: null,
                })
              }
              loading={categoriesLoading}
              typeName={selectedType?.name}
            />
          )}
          {step === 2 && (
            <SubcategoryStep
              key="subcategory"
              specializations={specializations}
              selectedId={selection.businessSpecializationId}
              onSelect={(id) => setSelection({ businessSpecializationId: id })}
              loading={specsLoading}
              categoryName={selectedCategory?.name}
              optional
            />
          )}
          {step === 3 && (
            <OrganizationStep
              key="org"
              data={organization}
              employeeCount={employeeCount}
              businessSize={businessSize}
              onChange={setOrganization}
              onEmployeeCountChange={setEmployeeCount}
              onBusinessSizeChange={setBusinessSize}
            />
          )}
          {step === 4 && (
            <ReviewStep
              key="review"
              typeName={selectedType?.name}
              categoryName={selectedCategory?.name}
              specializationName={selectedSpec?.name}
              companyName={organization.companyName}
              employeeCount={employeeCount}
              businessSize={businessSize}
              previewModules={provisioning.modules}
              previewSubmodules={provisioning.submodules}
              workflowNames={workflowPreview}
              onEditStep={setStep}
            />
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={back} disabled={saveStep.isPending}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={next}
            disabled={saveStep.isPending || !canContinue}
          >
            Continue
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => setShowConfirmModal(true)}
            disabled={complete.isPending || saveStep.isPending}
          >
            Confirm & Proceed
          </Button>
        )}
      </footer>

      <ConfirmationModal
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        loading={complete.isPending || saveStep.isPending}
      />
    </div>
  );
}

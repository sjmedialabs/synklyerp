import { create } from "zustand";
import type { OrganizationSetupInput } from "@/validators/onboarding-session";

export type OnboardingSelection = {
  businessTypeId: string | null;
  businessCategoryId: string | null;
  businessSpecializationId: string | null;
};

type OnboardingStore = {
  step: number;
  selection: OnboardingSelection;
  organization: Partial<OrganizationSetupInput>;
  employeeCount: OrganizationSetupInput["numberOfEmployees"] | null;
  businessSize: OrganizationSetupInput["businessSize"] | null;
  setStep: (step: number) => void;
  setSelection: (selection: Partial<OnboardingSelection>) => void;
  setOrganization: (data: Partial<OrganizationSetupInput>) => void;
  setEmployeeCount: (count: OrganizationSetupInput["numberOfEmployees"]) => void;
  setBusinessSize: (size: OrganizationSetupInput["businessSize"]) => void;
  hydrateFromSession: (session: {
    currentStep: number;
    businessTypeId: string | null;
    businessCategoryId: string | null;
    businessSpecializationId: string | null;
    organizationData: Partial<OrganizationSetupInput>;
    employeeCount: string | null;
    businessSize: string | null;
  }) => void;
  reset: () => void;
};

const initialSelection: OnboardingSelection = {
  businessTypeId: null,
  businessCategoryId: null,
  businessSpecializationId: null,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  step: 0,
  selection: initialSelection,
  organization: {},
  employeeCount: null,
  businessSize: null,
  setStep: (step) => set({ step }),
  setSelection: (selection) =>
    set((state) => ({ selection: { ...state.selection, ...selection } })),
  setOrganization: (data) =>
    set((state) => ({ organization: { ...state.organization, ...data } })),
  setEmployeeCount: (employeeCount) => set({ employeeCount }),
  setBusinessSize: (businessSize) => set({ businessSize }),
  hydrateFromSession: (session) =>
    set({
      step: session.currentStep,
      selection: {
        businessTypeId: session.businessTypeId,
        businessCategoryId: session.businessCategoryId,
        businessSpecializationId: session.businessSpecializationId,
      },
      organization: session.organizationData ?? {},
      employeeCount: (session.employeeCount as OrganizationSetupInput["numberOfEmployees"]) ?? null,
      businessSize: (session.businessSize as OrganizationSetupInput["businessSize"]) ?? null,
    }),
  reset: () =>
    set({
      step: 0,
      selection: initialSelection,
      organization: {},
      employeeCount: null,
      businessSize: null,
    }),
}));

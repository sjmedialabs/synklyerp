"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Pencil, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { COUNTRIES, getCitiesForState, getStatesForCountry } from "@/constants/geography";
import { BUSINESS_TYPES, INDUSTRY_SUBTYPES } from "@/constants/onboarding";
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES,
  EMPLOYEE_RANGES,
  type CompanyProfileDraftInput,
} from "@/validators/company-profile";
import {
  PROFILE_SECTIONS,
  calculateProfileProgress,
  isSectionComplete,
  type ProfileSectionId,
} from "@/lib/organisation-setup/company-profile/completion";
import { profileToForm } from "@/lib/organisation-setup/company-profile/mappers";
import { CompanyProfileProgress } from "@/modules/organisation-setup/components/company-profile-progress";
import { CompanyProfileSection } from "@/modules/organisation-setup/components/company-profile-section";
import { LogoUploader } from "@/modules/organisation-setup/components/logo-uploader";
import { useCompanyProfile, useCompanyProfileMutations } from "@/hooks/organisation-setup";

const DRAFT_KEY = "synkly:company-profile-draft";
const EMPTY_FORM: CompanyProfileDraftInput = {
  legal_company_name: "",
  trade_name: "",
  country: "India",
};

function normalizeUpper(field: keyof CompanyProfileDraftInput, value: string) {
  if (["gst_number", "pan_number", "ifsc_code"].includes(field)) {
    return value.toUpperCase();
  }
  return value;
}

export default function CompanyInformationPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const { data, isLoading } = useCompanyProfile();
  const { save, saveDraft } = useCompanyProfileMutations();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<CompanyProfileDraftInput>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<CompanyProfileDraftInput>(EMPTY_FORM);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    registration: false,
    address: false,
    contact: false,
    business: false,
    branding: false,
    banking: false,
  });

  const canEdit = isAdmin && editMode;
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);
  const progress = useMemo(() => calculateProfileProgress(form), [form]);

  const loadFromServer = useCallback((serverData: NonNullable<typeof data>) => {
    const mapped = profileToForm(serverData);
    setForm(mapped);
    setBaseline(mapped);
  }, []);

  useEffect(() => {
    if (!data) return;
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as CompanyProfileDraftInput;
        setForm(draft);
        setBaseline(profileToForm(data));
        return;
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    loadFromServer(data);
  }, [data, loadFromServer]);

  useEffect(() => {
    if (!dirty || !canEdit) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, dirty, canEdit]);

  const update = (key: keyof CompanyProfileDraftInput, value: string | number | undefined) => {
    const next = typeof value === "string" ? normalizeUpper(key, value) : value;
    setForm((prev) => ({ ...prev, [key]: next }));
  };

  const states = getStatesForCountry(form.country ?? "India");
  const cities = getCitiesForState(form.state ?? "");
  const industryOptions = form.industry_type && form.industry_type in INDUSTRY_SUBTYPES
    ? INDUSTRY_SUBTYPES[form.industry_type as keyof typeof INDUSTRY_SUBTYPES]
    : INDUSTRY_SUBTYPES[BUSINESS_TYPES[0]];

  const handleSave = async (continueNext = false) => {
    if (!isAdmin) {
      toast.error("Only admins can update company profile.");
      return;
    }
    try {
      if (progress.isCompleted) {
        await save.mutateAsync(form);
        toast.success("Company profile saved");
      } else {
        await saveDraft.mutateAsync(form);
        toast.success("Progress saved");
      }
      localStorage.removeItem(DRAFT_KEY);
      setBaseline(form);
      if (continueNext) {
        const next = PROFILE_SECTIONS.find((s) => !isSectionComplete(s.id as ProfileSectionId, form));
        if (next) {
          setOpenSections((prev) => ({ ...prev, [next.id]: true }));
          document.getElementById(next.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleSaveDraft = async () => {
    if (!isAdmin) return;
    try {
      await saveDraft.mutateAsync(form);
      localStorage.removeItem(DRAFT_KEY);
      setBaseline(form);
      toast.success("Draft saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft save failed");
    }
  };

  const handleCancel = () => {
    setForm(baseline);
    localStorage.removeItem(DRAFT_KEY);
    toast.message("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading company profile...
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader
        title="Company Information"
        description="Centralized master company profile for invoices, compliance, branding, and branch defaults."
        actions={
          isAdmin ? (
            <Button variant="outline" onClick={() => setEditMode((v) => !v)}>
              <Pencil size={16} className="mr-2" />
              {editMode ? "View Mode" : "Edit Mode"}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 space-y-4">
        <CompanyProfileProgress
          form={form}
          percentage={progress.percentage}
          completedCount={progress.completedCount}
        />
        {!isAdmin && (
          <p className="text-sm text-amber-700 dark:text-amber-300">Read-only access. Contact an admin to make changes.</p>
        )}
        {dirty && canEdit && (
          <p className="text-sm text-indigo-600 dark:text-indigo-300">You have unsaved changes. Draft auto-saves locally.</p>
        )}
      </div>

      <div className="space-y-4">
        <CompanyProfileSection
          id="basic"
          title="Basic Company Details"
          description="Legal identity and business classification"
          complete={isSectionComplete("basic", form)}
          open={openSections.basic}
          onToggle={() => setOpenSections((p) => ({ ...p, basic: !p.basic }))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Legal Company Name *</Label>
              <Input value={form.legal_company_name ?? ""} onChange={(e) => update("legal_company_name", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Trade Name</Label>
              <Input value={form.trade_name ?? ""} onChange={(e) => update("trade_name", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Company Type *</Label>
              <Select value={form.company_type ?? ""} onChange={(e) => update("company_type", e.target.value)} disabled={!canEdit}>
                <option value="">Select type</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>{COMPANY_TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date of Incorporation *</Label>
              <Input type="date" value={form.incorporation_date ?? ""} onChange={(e) => update("incorporation_date", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Industry Type *</Label>
              <Select
                value={form.industry_type ?? ""}
                onChange={(e) => {
                  update("industry_type", e.target.value);
                  update("subcategory", "");
                }}
                disabled={!canEdit}
              >
                <option value="">Select industry</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Subcategory *</Label>
              <Select value={form.subcategory ?? ""} onChange={(e) => update("subcategory", e.target.value)} disabled={!canEdit}>
                <option value="">Select subcategory</option>
                {industryOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="registration"
          title="Registration & Tax Details"
          description="GST, PAN, CIN, and compliance identifiers"
          complete={isSectionComplete("registration", form)}
          open={openSections.registration}
          onToggle={() => setOpenSections((p) => ({ ...p, registration: !p.registration }))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>GST Number (GSTIN) *</Label>
              <Input value={form.gst_number ?? ""} onChange={(e) => update("gst_number", e.target.value)} disabled={!canEdit} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <Label>PAN Number *</Label>
              <Input value={form.pan_number ?? ""} onChange={(e) => update("pan_number", e.target.value)} disabled={!canEdit} placeholder="ABCDE1234F" />
            </div>
            <div>
              <Label>CIN Number {form.company_type === "private_limited" ? "*" : ""}</Label>
              <Input value={form.cin_number ?? ""} onChange={(e) => update("cin_number", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>TAN Number</Label>
              <Input value={form.tan_number ?? ""} onChange={(e) => update("tan_number", e.target.value)} disabled={!canEdit} />
            </div>
            <div className="sm:col-span-2">
              <Label>MSME / Udyam Registration</Label>
              <Input value={form.msme_number ?? ""} onChange={(e) => update("msme_number", e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="address"
          title="Registered Office Details"
          description="Official registered address"
          complete={isSectionComplete("address", form)}
          open={openSections.address}
          onToggle={() => setOpenSections((p) => ({ ...p, address: !p.address }))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Address Line 1 *</Label>
              <Input value={form.address_line_1 ?? ""} onChange={(e) => update("address_line_1", e.target.value)} disabled={!canEdit} />
            </div>
            <div className="sm:col-span-2">
              <Label>Address Line 2</Label>
              <Input value={form.address_line_2 ?? ""} onChange={(e) => update("address_line_2", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Country *</Label>
              <Select value={form.country ?? ""} onChange={(e) => { update("country", e.target.value); update("state", ""); update("city", ""); }} disabled={!canEdit}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label>State *</Label>
              {states.length ? (
                <Select value={form.state ?? ""} onChange={(e) => { update("state", e.target.value); update("city", ""); }} disabled={!canEdit}>
                  <option value="">Select state</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              ) : (
                <Input value={form.state ?? ""} onChange={(e) => update("state", e.target.value)} disabled={!canEdit} />
              )}
            </div>
            <div>
              <Label>City *</Label>
              {cities.length ? (
                <Select value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} disabled={!canEdit}>
                  <option value="">Select city</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              ) : (
                <Input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} disabled={!canEdit} />
              )}
            </div>
            <div>
              <Label>PIN Code *</Label>
              <Input value={form.pincode ?? ""} onChange={(e) => update("pincode", e.target.value)} disabled={!canEdit} inputMode="numeric" />
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="contact"
          title="Contact Details"
          complete={isSectionComplete("contact", form)}
          open={openSections.contact}
          onToggle={() => setOpenSections((p) => ({ ...p, contact: !p.contact }))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Official Email *</Label>
              <Input type="email" value={form.official_email ?? ""} onChange={(e) => update("official_email", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Contact Phone *</Label>
              <Input value={form.contact_phone ?? ""} onChange={(e) => update("contact_phone", e.target.value)} disabled={!canEdit} placeholder="+919876543210" />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input value={form.alternate_phone ?? ""} onChange={(e) => update("alternate_phone", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input value={form.website_url ?? ""} onChange={(e) => update("website_url", e.target.value)} disabled={!canEdit} placeholder="https://" />
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="business"
          title="Business Profile"
          complete={isSectionComplete("business", form)}
          open={openSections.business}
          onToggle={() => setOpenSections((p) => ({ ...p, business: !p.business }))}
        >
          <div className="space-y-4">
            <div>
              <Label>Business Description *</Label>
              <Textarea value={form.business_description ?? ""} onChange={(e) => update("business_description", e.target.value)} rows={4} disabled={!canEdit} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Number of Employees *</Label>
                <Select value={form.employee_range ?? ""} onChange={(e) => update("employee_range", e.target.value)} disabled={!canEdit}>
                  <option value="">Select range</option>
                  {EMPLOYEE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div>
                <Label>Annual Turnover</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.annual_turnover ?? ""}
                  onChange={(e) => update("annual_turnover", e.target.value ? Number(e.target.value) : undefined)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="branding"
          title="Branding"
          complete={isSectionComplete("branding", form)}
          open={openSections.branding}
          onToggle={() => setOpenSections((p) => ({ ...p, branding: !p.branding }))}
        >
          <div className="space-y-4">
            <LogoUploader value={form.logo_url ?? ""} disabled={!canEdit} onUploaded={(url) => update("logo_url", url)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={form.primary_color || "#4F46E5"} onChange={(e) => update("primary_color", e.target.value)} disabled={!canEdit} className="h-10 w-14 p-1" />
                  <Input value={form.primary_color ?? ""} onChange={(e) => update("primary_color", e.target.value)} disabled={!canEdit} placeholder="#4F46E5" />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={form.secondary_color || "#0EA5E9"} onChange={(e) => update("secondary_color", e.target.value)} disabled={!canEdit} className="h-10 w-14 p-1" />
                  <Input value={form.secondary_color ?? ""} onChange={(e) => update("secondary_color", e.target.value)} disabled={!canEdit} placeholder="#0EA5E9" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>Tagline</Label>
                <Input value={form.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} disabled={!canEdit} />
              </div>
            </div>
          </div>
        </CompanyProfileSection>

        <CompanyProfileSection
          id="banking"
          title="Banking Details"
          complete={isSectionComplete("banking", form)}
          open={openSections.banking}
          onToggle={() => setOpenSections((p) => ({ ...p, banking: !p.banking }))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Bank Account Name *</Label>
              <Input value={form.bank_account_name ?? ""} onChange={(e) => update("bank_account_name", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Bank Name *</Label>
              <Input value={form.bank_name ?? ""} onChange={(e) => update("bank_name", e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Account Number *</Label>
              <Input value={form.account_number ?? ""} onChange={(e) => update("account_number", e.target.value)} disabled={!canEdit} inputMode="numeric" />
            </div>
            <div>
              <Label>IFSC Code *</Label>
              <Input value={form.ifsc_code ?? ""} onChange={(e) => update("ifsc_code", e.target.value)} disabled={!canEdit} placeholder="ABCD0123456" />
            </div>
            <div className="sm:col-span-2">
              <Label>Branch Name *</Label>
              <Input value={form.bank_branch_name ?? ""} onChange={(e) => update("bank_branch_name", e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        </CompanyProfileSection>
      </div>

      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={!dirty}>
              <RotateCcw size={16} className="mr-2" /> Cancel Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleSaveDraft()} disabled={saveDraft.isPending}>
              Save Draft
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleSave(false)} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => void handleSave(true)} disabled={save.isPending}>
              Save & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

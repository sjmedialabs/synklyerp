import { ingestLead, type IngestLeadInput } from "@/lib/crm/lead-ingestion-service";
import {
  getFormByEmbedToken,
  listFormFields,
  recordFormSubmission,
  recordFormView,
  createFormSubmission,
} from "@/repositories/sales/crm/forms-extended";

const LEAD_FIELD_MAP: Record<string, keyof IngestLeadInput> = {
  name: "name",
  email: "email",
  phone: "phone",
  company: "company",
  notes: "notes",
};

export async function getPublicForm(token: string) {
  const form = await getFormByEmbedToken(token);
  const fields = await listFormFields(form.tenantId, form.id);
  return { form, fields };
}

export async function submitPublicForm(
  token: string,
  payload: Record<string, unknown>,
  meta: { ipAddress?: string; userAgent?: string; referrer?: string }
) {
  const form = await getFormByEmbedToken(token);
  const fields = await listFormFields(form.tenantId, form.id);

  if (form.spamProtection === "honeypot" && payload._hp) {
    await recordFormSubmission(form.id, true);
    await createFormSubmission({
      tenantId: form.tenantId,
      formId: form.id,
      leadId: null,
      payload,
      isSpam: true,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return { spam: true, message: form.successMessage ?? "Thank you!" };
  }

  const leadInput: IngestLeadInput = {
    name: "",
    leadType: "INBOUND",
    source: form.leadSourceLabel ?? form.name,
    originalSource: form.leadSourceLabel ?? `Form: ${form.name}`,
    leadSourceId: form.leadSourceId ?? undefined,
    ingestChannel: "embed_form",
    attribution: {
      capturedFrom: form.name,
      campaign: form.campaign ?? undefined,
      landingPage: meta.referrer,
      ipAddress: meta.ipAddress,
      utmSource: payload.utm_source as string | undefined,
      utmMedium: payload.utm_medium as string | undefined,
      utmCampaign: payload.utm_campaign as string | undefined,
    },
  };

  for (const field of fields) {
    const val = payload[field.fieldKey];
    if (val == null || val === "") continue;
    const mapKey = field.mapToLeadField ?? field.fieldKey;
    const target = LEAD_FIELD_MAP[mapKey];
    if (target) {
      (leadInput as Record<string, unknown>)[target] = String(val);
    } else if (mapKey === "notes" || field.fieldKey === "message") {
      leadInput.notes = [leadInput.notes, `${field.label}: ${val}`].filter(Boolean).join("\n");
    }
  }

  if (!leadInput.name) {
    leadInput.name = String(payload.name ?? payload.email ?? "Form Lead");
  }

  const lead = await ingestLead(form.tenantId, leadInput);

  await recordFormSubmission(form.id, false);
  await createFormSubmission({
    tenantId: form.tenantId,
    formId: form.id,
    leadId: lead.id,
    payload,
    isSpam: false,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return {
    spam: false,
    leadId: lead.id,
    message: form.successMessage ?? "Thank you! We will contact you shortly.",
    redirectUrl: form.redirectUrl,
  };
}

export { recordFormView };

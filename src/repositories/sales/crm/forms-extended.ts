import { createAdminClient } from "@/lib/supabase/admin";
import { mapCrmForm } from "@/lib/mappers/crm";
import type { PaginatedQuery } from "@/types/api";

export type CrmFormFieldRow = {
  id: string;
  formId: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  options: string[];
  sortOrder: number;
  mapToLeadField: string | null;
};

function mapField(row: Record<string, unknown>): CrmFormFieldRow {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    fieldKey: row.field_key as string,
    label: row.label as string,
    fieldType: row.field_type as string,
    required: Boolean(row.required),
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    sortOrder: Number(row.sort_order ?? 0),
    mapToLeadField: (row.map_to_lead_field as string) ?? null,
  };
}

export async function getFormById(tenantId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_forms")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapCrmForm(data);
}

export async function getFormByEmbedToken(token: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_forms")
    .select("*")
    .eq("embed_token", token)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return mapCrmForm(data);
}

export async function updateForm(tenantId: string, id: string, input: Record<string, unknown>) {
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    ["name", "name"],
    ["description", "description"],
    ["status", "status"],
    ["category", "category"],
    ["successMessage", "success_message"],
    ["redirectUrl", "redirect_url"],
    ["spamProtection", "spam_protection"],
    ["notificationEmail", "notification_email"],
    ["campaign", "campaign"],
    ["leadSourceLabel", "lead_source_label"],
    ["leadSourceId", "lead_source_id"],
  ] as const;
  for (const [inKey, dbKey] of fields) {
    if (input[inKey] !== undefined) payload[dbKey] = input[inKey] || null;
  }
  if (input.tags !== undefined) payload.tags = input.tags;

  const { data, error } = await supabase
    .from("crm_forms")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapCrmForm(data);
}

export async function listFormFields(tenantId: string, formId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_form_fields")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("form_id", formId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapField);
}

export async function replaceFormFields(
  tenantId: string,
  formId: string,
  fields: Record<string, unknown>[]
) {
  const supabase = createAdminClient();
  await supabase.from("crm_form_fields").delete().eq("tenant_id", tenantId).eq("form_id", formId);

  if (!fields.length) return [];

  const rows = fields.map((f, i) => ({
    tenant_id: tenantId,
    form_id: formId,
    field_key: String(f.fieldKey),
    label: String(f.label),
    field_type: String(f.fieldType),
    required: Boolean(f.required),
    options: f.options ?? [],
    validation: f.validation ?? {},
    sort_order: f.sortOrder ?? i,
    map_to_lead_field: f.mapToLeadField ?? null,
  }));

  const { data, error } = await supabase.from("crm_form_fields").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []).map(mapField);
}

export async function recordFormView(formId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("crm_forms").select("view_count").eq("id", formId).single();
  await supabase
    .from("crm_forms")
    .update({ view_count: Number(data?.view_count ?? 0) + 1 })
    .eq("id", formId);
}

export async function recordFormSubmission(formId: string, isSpam: boolean) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("crm_forms")
    .select("submission_count, spam_count")
    .eq("id", formId)
    .single();
  await supabase
    .from("crm_forms")
    .update({
      submission_count: Number(data?.submission_count ?? 0) + 1,
      spam_count: Number(data?.spam_count ?? 0) + (isSpam ? 1 : 0),
      last_submission_at: new Date().toISOString(),
    })
    .eq("id", formId);
}

export async function createFormSubmission(input: {
  tenantId: string;
  formId: string;
  leadId: string | null;
  payload: Record<string, unknown>;
  isSpam: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("crm_form_submissions")
    .insert({
      tenant_id: input.tenantId,
      form_id: input.formId,
      lead_id: input.leadId,
      payload: input.payload,
      is_spam: input.isSpam,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function seedDefaultFormFields(tenantId: string, formId: string) {
  return replaceFormFields(tenantId, formId, [
    { fieldKey: "name", label: "Full name", fieldType: "text", required: true, mapToLeadField: "name", sortOrder: 0 },
    { fieldKey: "email", label: "Email", fieldType: "email", required: true, mapToLeadField: "email", sortOrder: 1 },
    { fieldKey: "phone", label: "Phone", fieldType: "phone", required: false, mapToLeadField: "phone", sortOrder: 2 },
    { fieldKey: "company", label: "Company", fieldType: "text", required: false, mapToLeadField: "company", sortOrder: 3 },
    { fieldKey: "message", label: "Message", fieldType: "textarea", required: false, mapToLeadField: "notes", sortOrder: 4 },
  ]);
}

// Re-export list/create from forms-webhooks for convenience
export { listForms, createForm } from "@/repositories/sales/crm/forms-webhooks";

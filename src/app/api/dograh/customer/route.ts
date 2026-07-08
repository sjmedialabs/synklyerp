import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import {
  buildDograhCustomerContext,
  extractDograhPreCallIds,
  extractDograhPreCallPhone,
} from "@/lib/sales/dograh";
import { verifyDograhRequest } from "@/lib/sales/dograh-auth";
import { findLeadByPhone, getLatestCallLogForLead } from "@/repositories/sales/crm/calls";
import { dograhCustomerQuerySchema, dograhPreCallSchema } from "@/validators/dograh";
import { z } from "zod";

async function resolveLeadContext(tenantId: string, phone: string, leadId?: string) {
  const lead = await findLeadByPhone(tenantId, phone, leadId);
  if (!lead) return null;

  const lastCall = await getLatestCallLogForLead(tenantId, lead.id);
  const context = buildDograhCustomerContext(lead, lastCall?.summary);
  return { lead, context };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = dograhCustomerQuerySchema.parse({
      phone: url.searchParams.get("phone"),
      tenantId: url.searchParams.get("tenantId") ?? undefined,
      leadId: url.searchParams.get("leadId") ?? undefined,
    });

    if (!(await verifyDograhRequest(req, query.tenantId))) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!query.tenantId) {
      return apiError("tenantId is required", 400, "TENANT_REQUIRED");
    }

    const resolved = await resolveLeadContext(query.tenantId, query.phone, query.leadId);
    if (!resolved) return apiError("Customer not found", 404, "NOT_FOUND");

    return NextResponse.json(resolved.context);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    if (error instanceof Error && error.message === "SCHEMA_NOT_MIGRATED") {
      return apiError(
        "Database migration 025 is required. Apply supabase/migrations/025_crm_dograh_calls.sql",
        503,
        "SCHEMA_NOT_MIGRATED"
      );
    }
    return apiError("Failed to load customer context", 500, "INTERNAL_ERROR");
  }
}

export async function POST(req: Request) {
  try {
    const body = dograhPreCallSchema.parse(await req.json());
    const phone = extractDograhPreCallPhone(body);
    if (!phone) return apiError("phone is required in pre-call payload", 400, "PHONE_REQUIRED");

    const ids = extractDograhPreCallIds(body);
    if (!(await verifyDograhRequest(req, ids.tenantId))) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!ids.tenantId) {
      return apiError("tenantId is required in initial_context", 400, "TENANT_REQUIRED");
    }

    const resolved = await resolveLeadContext(ids.tenantId, phone, ids.leadId);
    if (!resolved) return NextResponse.json({ initial_context: {} });

    return NextResponse.json({ initial_context: resolved.context });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    if (error instanceof Error && error.message === "SCHEMA_NOT_MIGRATED") {
      return apiError(
        "Database migration 025 is required. Apply supabase/migrations/025_crm_dograh_calls.sql",
        503,
        "SCHEMA_NOT_MIGRATED"
      );
    }
    return apiError("Failed to load customer context", 500, "INTERNAL_ERROR");
  }
}

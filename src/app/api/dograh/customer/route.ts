import { apiError, apiSuccess } from "@/lib/api/response";
import { buildDograhCustomerContext } from "@/lib/sales/dograh";
import { verifyDograhRequest } from "@/lib/sales/dograh-auth";
import { findLeadByPhone, getLatestCallLogForLead } from "@/repositories/sales/crm/calls";
import { dograhCustomerQuerySchema } from "@/validators/dograh";
import { z } from "zod";

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

    const lead = await findLeadByPhone(query.tenantId, query.phone, query.leadId);
    if (!lead) return apiError("Customer not found", 404, "NOT_FOUND");

    const lastCall = await getLatestCallLogForLead(query.tenantId, lead.id);
    const context = buildDograhCustomerContext(lead, lastCall?.summary);

    return apiSuccess(context);
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

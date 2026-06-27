import { apiError, apiSuccess } from "@/lib/api/response";
import { extractApiKeyFromHeaders } from "@/lib/crm/api-key-auth";
import { ingestLead } from "@/lib/crm/lead-ingestion-service";
import { resolveApiKeyByToken, logApiRequest, touchApiKeyUsed } from "@/repositories/sales/crm/api-keys";
import { publicLeadIngestSchema } from "@/validators/crm";
import { requireTenantModule } from "@/lib/modules/module-guard";
import { z } from "zod";

export async function POST(req: Request) {
  const started = Date.now();
  let tenantId: string | null = null;
  let apiKeyId: string | null = null;
  let leadSourceId: string | null = null;

  try {
    const token = extractApiKeyFromHeaders(req.headers);
    if (!token) {
      return apiError("Missing API key. Use Authorization: Bearer <key> or X-API-Key header.", 401, "UNAUTHORIZED");
    }

    const apiKey = await resolveApiKeyByToken(token);
    if (!apiKey) {
      return apiError("Invalid or revoked API key", 401, "UNAUTHORIZED");
    }

    tenantId = apiKey.tenantId;
    apiKeyId = apiKey.id;
    leadSourceId = apiKey.leadSourceId;

    await requireTenantModule(tenantId, "Sales");

    const body = publicLeadIngestSchema.parse(await req.json());
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;

    const lead = await ingestLead(tenantId, {
      name: body.name,
      company: body.company,
      phone: body.phone,
      email: body.email,
      leadType: body.leadType,
      source: body.source,
      notes: body.notes,
      serviceId: body.serviceId,
      leadSourceId: leadSourceId ?? undefined,
      originalSource: body.source ?? "API",
      attribution: {
        ...body.attribution,
        ipAddress: body.attribution?.ipAddress ?? ip,
      },
      ingestChannel: "public_api",
    });

    await touchApiKeyUsed(apiKey.id);

    await logApiRequest({
      tenantId,
      apiKeyId,
      leadSourceId,
      method: "POST",
      path: "/api/v1/public/leads",
      statusCode: 201,
      processingMs: Date.now() - started,
      requestPayload: body,
      responsePayload: { id: lead.id, status: lead.status },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
      idempotencyKey: body.idempotencyKey,
    });

    return apiSuccess({ id: lead.id, status: lead.status, version: "v1" }, undefined, 201);
  } catch (error) {
    const message = error instanceof z.ZodError ? "Validation failed" : error instanceof Error ? error.message : "Ingestion failed";
    const status = error instanceof z.ZodError ? 400 : 500;

    if (tenantId) {
      await logApiRequest({
        tenantId,
        apiKeyId,
        leadSourceId,
        method: "POST",
        path: "/api/v1/public/leads",
        statusCode: status,
        processingMs: Date.now() - started,
        errorMessage: message,
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
    }

    if (error instanceof z.ZodError) return apiError(message, 400, "VALIDATION_ERROR", error.flatten());
    return apiError(message, status, "INGESTION_ERROR");
  }
}

export async function GET() {
  return apiSuccess({
    version: "v1",
    endpoint: "POST /api/v1/public/leads",
    authentication: ["Bearer token", "X-API-Key"],
    documentation: "Create a lead via tenant-scoped capture API key.",
  });
}

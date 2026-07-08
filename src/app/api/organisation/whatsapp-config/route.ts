import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { getWhatsAppTenantConfig, upsertWhatsAppTenantConfig, isWhatsAppSchemaMigrated } from "@/repositories/sales/crm/whatsapp-config";
import { testWhatsAppCredentials } from "@/lib/sales/whatsapp-graph";
import { whatsappConfigSchema } from "@/validators/whatsapp-config";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const origin = new URL(req.url).origin;
    const webhookUrl = `${origin}/api/webhooks/whatsapp`;
    const migrationRequired = !(await isWhatsAppSchemaMigrated());
    const config = migrationRequired ? null : await getWhatsAppTenantConfig(tenantId);
    return apiSuccess({ config, webhookUrl, migrationRequired });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can test WhatsApp configuration", 403, "FORBIDDEN");
    }

    const body = z
      .object({
        action: z.literal("test"),
        phoneNumberId: z.string().min(1),
        businessAccountId: z.string().optional(),
        accessToken: z.string().optional(),
      })
      .parse(await req.json());

    let accessToken = body.accessToken?.trim();
    if (!accessToken || accessToken === "••••••••••••••••") {
      const existing = await getWhatsAppTenantConfig(tenantId);
      if (!existing?.accessTokenSet) {
        return apiError("Access token is required to test connection", 400, "VALIDATION_ERROR");
      }
      const supabase = (await import("@/lib/supabase/admin")).createAdminClient();
      const { data } = await supabase
        .from("crm_whatsapp_tenant_config")
        .select("access_token")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      accessToken = (data?.access_token as string) ?? "";
    }

    if (!accessToken) {
      return apiError("Access token is required to test connection", 400, "VALIDATION_ERROR");
    }

    const result = await testWhatsAppCredentials({
      phoneNumberId: body.phoneNumberId.trim(),
      accessToken,
      businessAccountId: body.businessAccountId?.trim() || null,
    });

    if (!result.ok) return apiError(result.message, 400, "WHATSAPP_API_ERROR");
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request) {
  try {
    const { tenantId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can update WhatsApp configuration", 403, "FORBIDDEN");
    }

    const body = whatsappConfigSchema.parse(await req.json());
    const existing = await getWhatsAppTenantConfig(tenantId);

    if (!body.accessToken?.trim() && !existing?.accessTokenSet) {
      return apiError("Access token is required for a new WhatsApp configuration", 400, "VALIDATION_ERROR");
    }

    const config = await upsertWhatsAppTenantConfig(tenantId, body);
    const origin = new URL(req.url).origin;
    return apiSuccess({
      config,
      webhookUrl: `${origin}/api/webhooks/whatsapp`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

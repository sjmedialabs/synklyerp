import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import { DOGRAH_WEBHOOK_PAYLOAD_TEMPLATE, testDograhCredentials } from "@/lib/sales/dograh";
import {
  getDograhTenantConfig,
  upsertDograhTenantConfig,
  isDograhSchemaMigrated,
  resolveDograhCredentials,
} from "@/repositories/sales/crm/dograh-config";
import { dograhConfigSchema, parseDograhAgentTriggerUuid } from "@/validators/dograh-config";
import { z } from "zod";

function buildEndpointUrls(origin: string) {
  return {
    customerUrl: `${origin}/api/dograh/customer`,
    webhookUrl: `${origin}/api/dograh/webhook`,
    updateStatusUrl: `${origin}/api/dograh/update-status`,
    webhookPayloadTemplate: DOGRAH_WEBHOOK_PAYLOAD_TEMPLATE,
  };
}

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.tenant.settings.read, { req });
    const origin = new URL(req.url).origin;
    const migrationRequired = !(await isDograhSchemaMigrated());
    const config = migrationRequired ? null : await getDograhTenantConfig(tenantId);
    const resolved = migrationRequired ? null : await resolveDograhCredentials(tenantId);
    const envFallback = {
      serverUrl: process.env.DOGRAH_URL?.trim() || null,
      apiKeySet: !!process.env.DOGRAH_API_KEY?.trim(),
      publicAppUrl:
        process.env.DOGRAH_APP_PUBLIC_URL?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        origin,
      agentTriggerUuid: parseDograhAgentTriggerUuid(process.env.DOGRAH_AGENT_TRIGGER_UUID),
      telephonyConfigurationId:
        process.env.DOGRAH_TELEPHONY_CONFIGURATION_ID &&
        /^\d+$/.test(process.env.DOGRAH_TELEPHONY_CONFIGURATION_ID)
          ? Number(process.env.DOGRAH_TELEPHONY_CONFIGURATION_ID)
          : null,
    };

    return apiSuccess({
      config,
      resolved: resolved
        ? {
            serverUrl: resolved.serverUrl,
            publicAppUrl: resolved.publicAppUrl,
            agentTriggerUuid: resolved.agentTriggerUuid,
            telephonyConfigurationId: resolved.telephonyConfigurationId,
            isActive: resolved.isActive,
          }
        : null,
      envFallback,
      migrationRequired,
      ...buildEndpointUrls(config?.publicAppUrl?.trim() || envFallback.publicAppUrl || origin),
    });
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId, role } = await getTenantApiContext(P.tenant.settings.update, { req });
    if (role !== "ADMIN") {
      return apiError("Only admins can test Dograh configuration", 403, "FORBIDDEN");
    }

    const body = z
      .object({
        action: z.literal("test"),
        serverUrl: z.string().optional(),
        apiKey: z.string().optional(),
        agentTriggerUuid: z.string().optional(),
      })
      .parse(await req.json());

    const result = await testDograhCredentials({
      tenantId,
      serverUrl: body.serverUrl,
      apiKey: body.apiKey && body.apiKey !== "••••••••••••••••" ? body.apiKey : undefined,
      agentTriggerUuid: body.agentTriggerUuid,
    });

    if (!result.ok) return apiError(result.message, 400, "DOGRAH_API_ERROR");
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
      return apiError("Only admins can update Dograh configuration", 403, "FORBIDDEN");
    }

    const body = dograhConfigSchema.parse(await req.json());
    const existing = await getDograhTenantConfig(tenantId);
    const hasKey = body.apiKey?.trim() && body.apiKey !== "••••••••••••••••";
    const hasEnvKey = !!process.env.DOGRAH_API_KEY?.trim();

    if (!hasKey && !existing?.apiKeySet && !hasEnvKey) {
      return apiError("API key is required for a new Dograh configuration", 400, "VALIDATION_ERROR");
    }

    const serverUrl = body.serverUrl.trim() || process.env.DOGRAH_URL?.trim() || "";
    if (!serverUrl) {
      return apiError("Dograh server URL is required", 400, "VALIDATION_ERROR");
    }

    const userProvided = body.agentTriggerUuid?.trim() ?? "";
    const parsedUserTrigger = parseDograhAgentTriggerUuid(userProvided);

    if (userProvided && !parsedUserTrigger) {
      return apiError(
        "Invalid API Trigger UUID. Paste only the UUID segment (or the full trigger URL).",
        400,
        "VALIDATION_ERROR"
      );
    }

    const agentTriggerUuid =
      parsedUserTrigger ||
      parseDograhAgentTriggerUuid(existing?.agentTriggerUuid) ||
      parseDograhAgentTriggerUuid(process.env.DOGRAH_AGENT_TRIGGER_UUID);

    if (body.isActive && !agentTriggerUuid) {
      return apiError(
        "API Trigger UUID is required when Dograh integration is enabled. Copy it from your Dograh workflow API Trigger node.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const config = await upsertDograhTenantConfig(tenantId, {
      ...body,
      serverUrl,
      agentTriggerUuid: agentTriggerUuid ?? "",
      apiKey: hasKey ? body.apiKey : undefined,
    });

    const origin = new URL(req.url).origin;
    const publicBase = config.publicAppUrl?.trim() || process.env.DOGRAH_APP_PUBLIC_URL?.trim() || origin;

    return apiSuccess({
      config,
      ...buildEndpointUrls(publicBase),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten().fieldErrors);
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

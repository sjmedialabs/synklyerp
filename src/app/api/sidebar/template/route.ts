import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import { resolveTenantSidebarTemplate, assignSidebarTemplate } from "@/repositories/sidebar/sidebar-templates";
import { assignSidebarTemplateSchema } from "@/validators/sidebar";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const template = await resolveTenantSidebarTemplate(tenantId);
    return apiSuccess(template);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantSession();
    if (ctx.role !== "ADMIN") {
      return apiError("Only admins can assign sidebar templates", 403, "FORBIDDEN");
    }
    const tenantId = await resolveTenantId(ctx);
    const body = assignSidebarTemplateSchema.parse(await req.json());
    const result = await assignSidebarTemplate(tenantId, body.templateId);
    return apiSuccess(result, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

import { apiError, apiSuccess } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { sidebarService } from "@/lib/sidebar/sidebar.service";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await requireTenantSession();
    const session = await auth();
    const tenantId = await resolveTenantId(ctx);

    const sidebar = await sidebarService.getSidebarForUser({
      tenantId,
      userId: ctx.userId,
      role: ctx.role,
      enabledModules: session?.user?.enabledModules ?? [],
      businessType: session?.user?.businessType ?? null,
      isPaymentRequired: session?.user?.isPaymentRequired === true,
    });

    return apiSuccess(sidebar);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

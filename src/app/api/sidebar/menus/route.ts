import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { listAllSidebarMenus } from "@/repositories/sidebar/sidebar-menus";

export async function GET() {
  try {
    const menus = await listAllSidebarMenus();
    return apiSuccess(menus);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

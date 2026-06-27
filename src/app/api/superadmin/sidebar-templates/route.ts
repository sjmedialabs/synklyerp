import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireSuperAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("sidebar_templates")
      .select("id, name, slug, description, is_default, is_active, business_type_id")
      .is("deleted_at", null)
      .order("sort_order");
    if (error) throw error;
    return apiSuccess(data ?? []);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

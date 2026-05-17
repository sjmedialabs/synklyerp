import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const { page, limit, search, sortBy, sortOrder, status, skip } = parsePagination(searchParams);
    const supabase = createAdminClient();

    let query = supabase
      .from("tenants")
      .select("id, name, business_type, industry_subtype, plan, contact_email, status, created_at", { count: "exact" })
      .is("deleted_at", null)
      .order(sortBy === "name" ? "name" : "created_at", { ascending: sortOrder === "asc" });

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query.range(skip, skip + limit - 1);
    if (error) throw error;

    type TenantRow = {
      id: string;
      name: string;
      business_type: string;
      industry_subtype: string | null;
      plan: string;
      contact_email: string | null;
      status: string;
      created_at: string;
    };

    const enriched = await Promise.all(
      ((data ?? []) as TenantRow[]).map(async (t) => {
        const [{ count: usersCount }, { count: branchesCount }] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", t.id),
          supabase.from("branches").select("id", { count: "exact", head: true }).eq("tenant_id", t.id).is("deleted_at", null),
        ]);
        return {
          id: t.id,
          name: t.name,
          businessType: t.business_type,
          industrySubtype: t.industry_subtype,
          plan: t.plan,
          contactEmail: t.contact_email,
          status: t.status,
          createdAt: t.created_at,
          usersCount: usersCount ?? 0,
          branchesCount: branchesCount ?? 0,
        };
      })
    );

    return apiSuccess(enriched, paginationMeta(count ?? 0, page, limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

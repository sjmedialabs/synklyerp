import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { getSubcategoryById } from "@/repositories/provisioning/business-types";
import { getTenantBusinessProfile } from "@/repositories/provisioning/tenant-business-profile";
import { getTenantSubscriptionView } from "@/lib/platform/tenant-subscription-service";
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
        const [profile, subscription] = await Promise.all([
          getTenantBusinessProfile(t.id),
          getTenantSubscriptionView(t.id).catch(() => null),
        ]);

        let businessTypeSlug: string | null = null;
        let businessSubcategorySlug: string | null = null;
        if (profile) {
          const match = await getSubcategoryById(profile.businessSubcategoryId);
          businessTypeSlug = match?.type.slug ?? null;
          businessSubcategorySlug = match?.subcategory.slug ?? null;
        }

        return {
          id: t.id,
          name: t.name,
          businessType: t.business_type,
          industrySubtype: t.industry_subtype,
          businessTypeSlug,
          businessSubcategorySlug,
          plan: t.plan,
          contactEmail: t.contact_email,
          status: subscription?.tenantStatus ?? t.status,
          subscriptionStatus: subscription?.subscriptionStatus ?? null,
          expiresAt: subscription?.expiresAt ?? null,
          isExpired: subscription?.isExpired ?? false,
          createdAt: t.created_at,
        };
      })
    );

    return apiSuccess(enriched, paginationMeta(count ?? 0, page, limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

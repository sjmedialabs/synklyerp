import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import { getUserMenuPreferences, upsertUserMenuPreferences } from "@/repositories/sidebar/user-menu-preferences";
import { toggleFavoriteSchema } from "@/validators/sidebar";

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const body = toggleFavoriteSchema.parse(await req.json());

    const prefs = await getUserMenuPreferences(tenantId, ctx.userId);
    const favorites = new Set(prefs.favoriteMenuSlugs);

    if (body.favorite) favorites.add(body.menuSlug);
    else favorites.delete(body.menuSlug);

    await upsertUserMenuPreferences(tenantId, ctx.userId, {
      favoriteMenuSlugs: [...favorites],
    });

    return apiSuccess({ favoriteMenuSlugs: [...favorites] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

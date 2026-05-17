import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError, requireTenantSession, resolveTenantId } from "@/lib/tenant/context";
import * as repo from "@/repositories/hr/attendance";
import { attendanceSchema } from "@/validators/hr";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const date = url.searchParams.get("date") ?? undefined;
    const result = await repo.listAttendance(tenantId, { ...params, date });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireTenantSession();
    const tenantId = await resolveTenantId(ctx);
    const body = attendanceSchema.parse(await req.json());
    return apiSuccess(await repo.upsertAttendance(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

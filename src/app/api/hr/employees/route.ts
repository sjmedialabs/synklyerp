import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/hr/employees";
import { employeeSchema } from "@/validators/hr";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.hr.employees.read, { req });
    const url = new URL(req.url);
    const params = parsePagination(url.searchParams);
    const status = url.searchParams.get("status") ?? undefined;
    const branchId = url.searchParams.get("branchId") ?? undefined;
    const result = await repo.listEmployees(tenantId, { ...params, status, branchId });
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.hr.employees.create, { req });
    const body = employeeSchema.parse(await req.json());
    return apiSuccess(await repo.createEmployee(tenantId, body), undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

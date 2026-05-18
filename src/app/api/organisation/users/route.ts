import { apiError, apiSuccess, parsePagination, paginationMeta } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/organisation/users";
import { orgUserSchema } from "@/validators/organisation";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.users.read, { req });
    const { searchParams } = new URL(req.url);
    const params = parsePagination(searchParams);
    const result = await repo.listOrgUsers(tenantId, params);
    return apiSuccess(result.items, paginationMeta(result.total, result.page, result.limit));
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.organisation.users.create, { req });
    const body = orgUserSchema.parse(await req.json());
    if (!body.password) {
      return apiError("Password is required for new users", 400, "VALIDATION_ERROR");
    }
    const user = await repo.createOrgUser(tenantId, {
      name: body.name,
      email: body.email,
      password: body.password,
      userCode: body.userCode,
      designationId: body.designationId,
      department: body.department,
      branchId: body.branchId,
      roleId: body.roleId,
      status: body.status,
    });
    return apiSuccess(user, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

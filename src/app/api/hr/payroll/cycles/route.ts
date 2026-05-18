import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import * as repo from "@/repositories/hr/payroll";
import { payrollCycleSchema } from "@/validators/hr";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.hr.payroll.read, { req });
    const cycles = await repo.listPayrollCycles(tenantId);
    return apiSuccess(cycles);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getTenantApiContext(P.hr.payroll.create, { req });
    const body = payrollCycleSchema.parse(await req.json());
    const cycle = await repo.createPayrollCycle(ctx.tenantId, {
      month: body.month,
      year: body.year,
      processedBy: ctx.email,
    });
    return apiSuccess(cycle, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    if (error instanceof Error && error.message === "CYCLE_EXISTS") {
      return apiError("A payroll cycle already exists for this period", 409, "CYCLE_EXISTS");
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

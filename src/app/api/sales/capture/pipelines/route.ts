import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError } from "@/lib/tenant/context";
import { getTenantApiContext } from "@/lib/rbac/api-guard";
import { P } from "@/lib/rbac/checks";
import {
  createPipeline,
  listPipelines,
  listPipelineStages,
  replacePipelineStages,
  seedDefaultPipeline,
} from "@/repositories/sales/crm/pipelines";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.read, { req });
    const url = new URL(req.url);
    if (url.searchParams.get("seed") === "1") await seedDefaultPipeline(tenantId);

    const pipelineId = url.searchParams.get("pipelineId");
    if (pipelineId) {
      return apiSuccess(await listPipelineStages(tenantId, pipelineId));
    }

    const pipelines = await listPipelines(tenantId);
    const withStages = await Promise.all(
      pipelines.map(async (p) => ({
        ...p,
        stages: await listPipelineStages(tenantId, p.id),
      }))
    );
    return apiSuccess(withStages);
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function POST(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.create, { req });
    const body = z
      .object({
        name: z.string().min(2),
        industry: z.string().optional(),
        stages: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .parse(await req.json());

    const pipeline = await createPipeline(tenantId, body);
    if (body.stages?.length) {
      await replacePipelineStages(tenantId, pipeline.id, body.stages);
    }
    return apiSuccess(pipeline, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PUT(req: Request) {
  try {
    const { tenantId } = await getTenantApiContext(P.sales.leads.update, { req });
    const body = z
      .object({ pipelineId: z.string().uuid(), stages: z.array(z.record(z.string(), z.unknown())) })
      .parse(await req.json());
    return apiSuccess(await replacePipelineStages(tenantId, body.pipelineId, body.stages));
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

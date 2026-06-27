import { apiError, apiSuccess } from "@/lib/api/response";
import { submitPublicForm } from "@/lib/crm/form-submission-service";
import { z } from "zod";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = z.record(z.string(), z.unknown()).parse(await req.json());
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

    const result = await submitPublicForm(token, body, {
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
      referrer: req.headers.get("referer") ?? undefined,
    });

    if (result.spam) {
      return apiSuccess({ message: result.message });
    }

    return apiSuccess(
      { leadId: result.leadId, message: result.message, redirectUrl: result.redirectUrl },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    return apiError(error instanceof Error ? error.message : "Submission failed", 500, "SUBMIT_ERROR");
  }
}

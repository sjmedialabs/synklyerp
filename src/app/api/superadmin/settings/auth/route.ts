import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { handleApiError, requireSuperAdmin } from "@/lib/tenant/context";
import {
  getAuthPlatformSettings,
  updateAuthPlatformSettings,
} from "@/lib/auth/platform-settings";

const patchSchema = z.object({
  otpSignupEnabled: z.boolean(),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    return apiSuccess(await getAuthPlatformSettings());
  } catch (error) {
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireSuperAdmin();
    const body = patchSchema.parse(await req.json());
    const settings = await updateAuthPlatformSettings(body);
    return apiSuccess(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const err = handleApiError(error);
    return apiError(err.message, err.status, err.code);
  }
}

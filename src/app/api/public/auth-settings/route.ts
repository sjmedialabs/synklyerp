import { apiError, apiSuccess } from "@/lib/api/response";
import { getAuthPlatformSettings } from "@/lib/auth/platform-settings";

export async function GET() {
  try {
    const settings = await getAuthPlatformSettings();
    return apiSuccess(settings);
  } catch {
    return apiSuccess({ otpSignupEnabled: false });
  }
}

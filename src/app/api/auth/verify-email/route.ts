import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyEmailToken } from "@/lib/auth/email-verification";

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return apiError("Verification token is required", 400);

    const result = await verifyEmailToken(token);
    if (!result.ok) {
      return apiError("This verification link is invalid or has expired", 400, "INVALID_TOKEN");
    }

    return apiSuccess({ verified: true, email: result.email });
  } catch (error) {
    console.error(error);
    return apiError("Verification failed", 500);
  }
}

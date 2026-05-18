import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getClientIp } from "@/lib/auth/rate-limit";
import { issueRefreshToken } from "@/lib/auth/refresh-token";
import { z } from "zod";

const schema = z.object({
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Not authenticated", 401, "UNAUTHORIZED");
    }

    const body = schema.parse(await req.json().catch(() => ({})));

    await issueRefreshToken({
      userId: session.user.id,
      rememberMe: body.rememberMe,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return apiSuccess({ issued: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", 400, "VALIDATION_ERROR", error.flatten());
    }
    console.error(error);
    return apiError("Failed to issue session", 500);
  }
}

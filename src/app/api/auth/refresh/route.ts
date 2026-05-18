import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { REFRESH_COOKIE, validateRefreshToken } from "@/lib/auth/refresh-token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(REFRESH_COOKIE)?.value;
    const validated = await validateRefreshToken(raw);

    if (!validated) {
      return apiError("Invalid or expired refresh token", 401, "INVALID_REFRESH");
    }

    const session = await auth();
    if (!session?.user?.id || session.user.id !== validated.userId) {
      return apiError("Session mismatch", 401, "UNAUTHORIZED");
    }

    return apiSuccess({ refreshed: true });
  } catch (error) {
    console.error(error);
    return apiError("Refresh failed", 500);
  }
}

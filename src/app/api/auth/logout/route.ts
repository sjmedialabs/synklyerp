import { cookies } from "next/headers";
import { apiError, apiSuccess } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import {
  clearRefreshCookie,
  REFRESH_COOKIE,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
} from "@/lib/auth/refresh-token";

export async function POST() {
  try {
    const session = await auth();
    const cookieStore = await cookies();
    const raw = cookieStore.get(REFRESH_COOKIE)?.value;

    if (raw) await revokeRefreshToken(raw);
    if (session?.user?.id) {
      await revokeAllUserRefreshTokens(session.user.id);
    }
    await clearRefreshCookie();

    return apiSuccess({ loggedOut: true });
  } catch (error) {
    console.error(error);
    return apiError("Logout failed", 500);
  }
}

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const REFRESH_COOKIE = "synkly.refresh_token";

const REMEMBER_ME_DAYS = 30;
const DEFAULT_SESSION_DAYS = 1;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenMaxAge(rememberMe: boolean) {
  return (rememberMe ? REMEMBER_ME_DAYS : DEFAULT_SESSION_DAYS) * 24 * 60 * 60;
}

export async function issueRefreshToken(input: {
  userId: string;
  rememberMe: boolean;
  userAgent?: string;
  ipAddress?: string;
}) {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(
    Date.now() + refreshTokenMaxAge(input.rememberMe) * 1000
  ).toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase.from("refresh_tokens").insert({
    user_id: input.userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: input.userAgent ?? null,
    ip_address: input.ipAddress ?? null,
  });
  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: refreshTokenMaxAge(input.rememberMe),
  });

  return { expiresAt };
}

export async function validateRefreshToken(raw: string | undefined) {
  if (!raw) return null;

  const supabase = createAdminClient();
  const tokenHash = hashToken(raw);

  const { data, error } = await supabase
    .from("refresh_tokens")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    user_id: string;
    expires_at: string;
    revoked_at: string | null;
  };

  if (row.revoked_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  return { id: row.id, userId: row.user_id };
}

export async function revokeRefreshToken(raw: string | undefined) {
  if (!raw) return;
  const supabase = createAdminClient();
  await supabase
    .from("refresh_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hashToken(raw));
}

export async function revokeAllUserRefreshTokens(userId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("refresh_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
}

export async function clearRefreshCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_COOKIE);
}

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_HOURS = 24;

export function buildVerificationUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();
  await supabase
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  const { error } = await supabase.from("email_verification_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return { token, expiresAt };
}

export async function verifyEmailToken(token: string) {
  const supabase = createAdminClient();
  const { data: tokens, error } = await supabase
    .from("email_verification_tokens")
    .select("id, user_id, token_hash, expires_at, used_at")
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  let matched: (typeof tokens)[number] | null = null;
  for (const row of tokens ?? []) {
    const ok = await bcrypt.compare(token, row.token_hash);
    if (ok) {
      matched = row;
      break;
    }
  }

  if (!matched) return { ok: false as const, reason: "invalid" as const };

  await supabase
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", matched.id);

  await supabase
    .from("users")
    .update({ email_verified: new Date().toISOString() })
    .eq("id", matched.user_id);

  const { data: user } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", matched.user_id)
    .maybeSingle();

  return { ok: true as const, userId: matched.user_id, email: user?.email ?? null };
}

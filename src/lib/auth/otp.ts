import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type OtpChannel = "email" | "sms";
export type OtpPurpose = "login" | "signup" | "reset";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeIdentifier(channel: OtpChannel, identifier: string) {
  const trimmed = identifier.trim();
  return channel === "email" ? trimmed.toLowerCase() : trimmed.replace(/\s/g, "");
}

export async function createOtp(channel: OtpChannel, identifier: string, purpose: OtpPurpose) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
  const normalized = normalizeIdentifier(channel, identifier);

  const supabase = createAdminClient();
  await supabase.from("otp_verifications").insert({
    channel,
    identifier: normalized,
    code_hash: codeHash,
    purpose,
    expires_at: expiresAt,
  });

  return { code, expiresAt };
}

export async function verifyOtp(channel: OtpChannel, identifier: string, purpose: OtpPurpose, code: string) {
  const supabase = createAdminClient();
  const id = normalizeIdentifier(channel, identifier);

  const { data: rows, error } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("identifier", id)
    .eq("purpose", purpose)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = rows?.[0];
  if (!row) return { ok: false as const, reason: "not_found" };

  if (new Date(row.expires_at as string) < new Date()) {
    return { ok: false as const, reason: "expired" };
  }

  if ((row.attempts as number) >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: "max_attempts" };
  }

  const valid = await bcrypt.compare(code, row.code_hash as string);
  if (!valid) {
    await supabase
      .from("otp_verifications")
      .update({ attempts: (row.attempts as number) + 1 })
      .eq("id", row.id);
    return { ok: false as const, reason: "invalid" };
  }

  await supabase.from("otp_verifications").update({ verified_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true as const };
}

export function devOtpEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.OTP_DEV_LOG === "true";
}

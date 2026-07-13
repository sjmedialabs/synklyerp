import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

export type AuthPlatformSettings = {
  otpSignupEnabled: boolean;
};

const DEFAULT_AUTH_SETTINGS: AuthPlatformSettings = {
  otpSignupEnabled: false,
};

function parseAuthSettings(value: unknown): AuthPlatformSettings {
  if (!value || typeof value !== "object") return DEFAULT_AUTH_SETTINGS;
  const row = value as Record<string, unknown>;
  return {
    otpSignupEnabled:
      typeof row.otpSignupEnabled === "boolean"
        ? row.otpSignupEnabled
        : DEFAULT_AUTH_SETTINGS.otpSignupEnabled,
  };
}

export async function getAuthPlatformSettings(): Promise<AuthPlatformSettings> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "auth")
      .maybeSingle();
    if (error) {
      if (isMissingSchemaError(error)) return DEFAULT_AUTH_SETTINGS;
      throw error;
    }
    return parseAuthSettings(data?.value);
  } catch {
    return DEFAULT_AUTH_SETTINGS;
  }
}

export async function updateAuthPlatformSettings(
  patch: Partial<AuthPlatformSettings>
): Promise<AuthPlatformSettings> {
  const current = await getAuthPlatformSettings();
  const next = { ...current, ...patch };
  const supabase = createAdminClient();
  const { error } = await supabase.from("platform_settings").upsert({
    key: "auth",
    value: next,
  });
  if (error) throw error;
  return next;
}

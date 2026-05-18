import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingSchemaError } from "@/lib/db/schema-errors";

const LOCKOUT_WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

export async function isAccountLocked(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("login_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("success", false)
    .gte("created_at", since);

  if (error) {
    if (isMissingSchemaError(error)) return false;
    throw error;
  }
  return (count ?? 0) >= MAX_FAILURES;
}

export async function isEmailLocked(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) return false;
  return isAccountLocked((user as { id: string }).id);
}

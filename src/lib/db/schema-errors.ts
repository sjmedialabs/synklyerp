/** True when Supabase/Postgres reports a missing table or column (migrations not applied). */
export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "PGRST205" || e.code === "42703" || e.code === "42P01") return true;
  const msg = e.message ?? "";
  return msg.includes("does not exist") || msg.includes("Could not find the table");
}

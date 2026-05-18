import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export async function checkRateLimit(
  bucketKey: string,
  maxHits: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const { data: row, error } = await supabase
    .from("auth_rate_limits")
    .select("hit_count, window_start")
    .eq("bucket_key", bucketKey)
    .maybeSingle();

  if (error) throw error;

  if (!row) {
    await supabase.from("auth_rate_limits").upsert({
      bucket_key: bucketKey,
      hit_count: 1,
      window_start: now.toISOString(),
      updated_at: now.toISOString(),
    });
    return { allowed: true, remaining: maxHits - 1 };
  }

  const r = row as { hit_count: number; window_start: string };
  const started = new Date(r.window_start);

  if (started < windowStart) {
    await supabase.from("auth_rate_limits").upsert({
      bucket_key: bucketKey,
      hit_count: 1,
      window_start: now.toISOString(),
      updated_at: now.toISOString(),
    });
    return { allowed: true, remaining: maxHits - 1 };
  }

  if (r.hit_count >= maxHits) {
    const retryAfter = Math.ceil(
      (started.getTime() + windowSeconds * 1000 - now.getTime()) / 1000
    );
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  await supabase
    .from("auth_rate_limits")
    .update({
      hit_count: r.hit_count + 1,
      updated_at: now.toISOString(),
    })
    .eq("bucket_key", bucketKey);

  return { allowed: true, remaining: maxHits - r.hit_count - 1 };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

import crypto from "crypto";
import bcrypt from "bcryptjs";

const KEY_PREFIX = "sk_live_";

export function generateApiKeyPair() {
  const raw = crypto.randomBytes(24).toString("hex");
  const apiKey = `${KEY_PREFIX}${raw}`;
  return { apiKey, apiSecret: apiKey, keyPrefix: apiKey.slice(0, 16) };
}

export function hashApiSecret(secret: string) {
  return bcrypt.hashSync(secret, 10);
}

export function verifyApiSecret(secret: string, hash: string) {
  return bcrypt.compareSync(secret, hash);
}

export function extractBearerToken(authHeader: string | null) {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export function extractApiKeyFromHeaders(headers: Headers) {
  return (
    extractBearerToken(headers.get("authorization")) ??
    headers.get("x-api-key") ??
    headers.get("x-synkly-api-key")
  );
}

export function timingSafeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

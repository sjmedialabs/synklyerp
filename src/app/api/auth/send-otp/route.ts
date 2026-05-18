import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyCaptcha } from "@/lib/auth/captcha";
import { deliverOtp, shouldLogDevOtp } from "@/lib/auth/delivery";
import {
  createOtp,
  devOtpEnabled,
  getOtpResendCooldown,
  MAX_OTP_SENDS_PER_HOUR,
  otpRateLimitKey,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/otp";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { findUserByEmail } from "@/repositories/auth";
import { findUserByPhone } from "@/repositories/auth/users";
import { z } from "zod";

const schema = z.object({
  channel: z.enum(["email", "sms"]),
  identifier: z.string().min(3),
  purpose: z.enum(["login", "signup", "reset"]),
  captchaToken: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const { channel, identifier, purpose } = body;
    const ip = getClientIp(req);

    const captchaOk = await verifyCaptcha(body.captchaToken);
    if (!captchaOk) {
      return apiError("CAPTCHA verification failed", 400, "CAPTCHA_FAILED");
    }

    const identifierLimit = await checkRateLimit(
      otpRateLimitKey(channel, identifier, purpose),
      MAX_OTP_SENDS_PER_HOUR,
      3600
    );
    if (!identifierLimit.allowed) {
      return apiError(
        `Too many codes sent. Try again in ${identifierLimit.retryAfterSeconds}s`,
        429,
        "RATE_LIMITED",
        { retryAfterSeconds: identifierLimit.retryAfterSeconds }
      );
    }

    const ipLimit = await checkRateLimit(`otp-ip:${ip}`, 30, 3600);
    if (!ipLimit.allowed) {
      return apiError("Too many requests from this network", 429, "RATE_LIMITED");
    }

    if (purpose === "login") {
      const user =
        channel === "email"
          ? await findUserByEmail(identifier)
          : await findUserByPhone(identifier);
      if (!user || user.status !== "ACTIVE") {
        return apiError(
          "No account found for this " + (channel === "email" ? "email" : "phone number"),
          404,
          "NOT_FOUND"
        );
      }
    }

    if (purpose === "reset" && channel === "email") {
      const user = await findUserByEmail(identifier);
      if (!user) return apiError("No account found for this email", 404, "NOT_FOUND");
    }

    if (purpose === "signup" && channel === "email") {
      const existing = await findUserByEmail(identifier);
      if (existing) {
        return apiError("An account with this email already exists", 409, "CONFLICT");
      }
    }

    const cooldown = await getOtpResendCooldown(channel, identifier, purpose);
    if (cooldown > 0) {
      return apiError(
        `Please wait ${cooldown}s before requesting another code`,
        429,
        "RESEND_COOLDOWN",
        { retryAfterSeconds: cooldown }
      );
    }

    const { code, expiresAt } = await createOtp(channel, identifier, purpose, {
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    try {
      await deliverOtp(channel, identifier, code, purpose);
    } catch (deliveryErr) {
      console.error("[OTP delivery]", deliveryErr);
      if (process.env.NODE_ENV === "production" && !devOtpEnabled()) {
        return apiError("Could not send verification code. Try again later.", 503, "DELIVERY_FAILED");
      }
    }

    if (shouldLogDevOtp()) {
      console.log(`[OTP ${purpose}] ${channel}=${identifier} code=${code}`);
    }

    const payload: {
      sent: boolean;
      expiresAt: string;
      resendAfterSeconds: number;
      devCode?: string;
    } = {
      sent: true,
      expiresAt,
      resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
    if (devOtpEnabled()) payload.devCode = code;

    return apiSuccess(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", 400, "VALIDATION_ERROR", error.flatten());
    }
    if (error instanceof Error && error.message.startsWith("RESEND_COOLDOWN:")) {
      const seconds = Number(error.message.split(":")[1]) || OTP_RESEND_COOLDOWN_SECONDS;
      return apiError(`Please wait ${seconds}s before requesting another code`, 429, "RESEND_COOLDOWN", {
        retryAfterSeconds: seconds,
      });
    }
    if (error instanceof Error && error.message === "OTP_SCHEMA_MISSING") {
      return apiError(
        "OTP is not configured. Run Supabase migrations 004–006 or use email/password login.",
        503,
        "OTP_SCHEMA_MISSING"
      );
    }
    console.error(error);
    return apiError("Failed to send OTP", 500);
  }
}

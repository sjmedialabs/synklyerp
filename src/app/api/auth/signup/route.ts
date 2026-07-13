import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyOtp } from "@/lib/auth/otp";
import { assertPasswordPolicy } from "@/lib/auth/password-policy";
import { getAuthPlatformSettings } from "@/lib/auth/platform-settings";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
} from "@/lib/auth/email-verification";
import { sendEmailVerificationLink } from "@/lib/auth/delivery/email";
import { createTenantWithAdmin } from "@/repositories/auth/users";
import { findUserByEmail } from "@/repositories/auth";
import { findUserByPhone } from "@/repositories/auth/users";
import { z } from "zod";

const otpSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  planSlug: z.string().min(2),
  emailOtp: z.string().length(6),
  smsOtp: z.string().length(6),
});

const basicSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  planSlug: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const settings = await getAuthPlatformSettings();
    const raw = await req.json();

    if (settings.otpSignupEnabled) {
      const body = otpSchema.parse(raw);

      const emailCheck = await verifyOtp("email", body.email, "signup", body.emailOtp);
      if (!emailCheck.ok) {
        return apiError("Invalid or expired email verification code", 400, "INVALID_OTP");
      }

      const smsCheck = await verifyOtp("sms", body.phone, "signup", body.smsOtp);
      if (!smsCheck.ok) {
        return apiError("Invalid or expired mobile verification code", 400, "INVALID_OTP");
      }

      assertPasswordPolicy(body.password);

      const existingEmail = await findUserByEmail(body.email);
      if (existingEmail) {
        return apiError("An account with this email already exists", 409, "CONFLICT");
      }

      const existingPhone = await findUserByPhone(body.phone);
      if (existingPhone) {
        return apiError("An account with this mobile number already exists", 409, "CONFLICT");
      }

      await createTenantWithAdmin({
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        password: body.password,
        planSlug: body.planSlug,
        emailVerified: true,
      });

      return apiSuccess({ created: true, mode: "otp" }, undefined, 201);
    }

    const body = basicSchema.parse(raw);
    assertPasswordPolicy(body.password);

    const existingEmail = await findUserByEmail(body.email);
    if (existingEmail) {
      return apiError("An account with this email already exists", 409, "CONFLICT");
    }

    const existingPhone = await findUserByPhone(body.phone);
    if (existingPhone) {
      return apiError("An account with this mobile number already exists", 409, "CONFLICT");
    }

    const { user } = await createTenantWithAdmin({
      companyName: body.companyName,
      email: body.email,
      phone: body.phone,
      password: body.password,
      planSlug: body.planSlug,
      emailVerified: false,
    });

    const { token } = await createEmailVerificationToken(user.id);
    const verifyUrl = buildVerificationUrl(token);

    try {
      await sendEmailVerificationLink(body.email, verifyUrl);
    } catch (deliveryErr) {
      console.error("[signup] verification email failed", deliveryErr);
      if (process.env.NODE_ENV === "production") {
        return apiError("Account created but verification email could not be sent", 503);
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[signup] verification link: ${verifyUrl}`);
    }

    return apiSuccess(
      { created: true, mode: "email_link", requiresEmailVerification: true },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    }
    const msg = error instanceof Error ? error.message : "Signup failed";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return apiError("An account with this email or phone already exists", 409, "CONFLICT");
    }
    console.error(error);
    return apiError("Signup failed", 500);
  }
}

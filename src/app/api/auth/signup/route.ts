import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyOtp } from "@/lib/auth/otp";
import { createTenantWithAdmin } from "@/repositories/auth/users";
import { z } from "zod";

const schema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  channel: z.enum(["email", "sms"]),
  otp: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const identifier = body.channel === "email" ? body.email : body.phone ?? "";
    if (!identifier) return apiError("Phone number required for SMS signup", 400);

    const verified = await verifyOtp(body.channel, identifier, "signup", body.otp);
    if (!verified.ok) {
      const msg =
        verified.reason === "expired"
          ? "OTP expired. Request a new code."
          : verified.reason === "max_attempts"
            ? "Too many attempts. Request a new code."
            : "Invalid OTP code";
      return apiError(msg, 400, "INVALID_OTP");
    }

    await createTenantWithAdmin({
      companyName: body.companyName,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    return apiSuccess({ created: true }, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    const msg = error instanceof Error ? error.message : "Signup failed";
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return apiError("An account with this email already exists", 409, "CONFLICT");
    }
    console.error(error);
    return apiError("Signup failed", 500);
  }
}

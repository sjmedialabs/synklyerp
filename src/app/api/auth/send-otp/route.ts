import { apiError, apiSuccess } from "@/lib/api/response";
import { createOtp, devOtpEnabled } from "@/lib/auth/otp";
import { findUserByEmail } from "@/repositories/auth";
import { findUserByPhone } from "@/repositories/auth/users";
import { z } from "zod";

const schema = z.object({
  channel: z.enum(["email", "sms"]),
  identifier: z.string().min(3),
  purpose: z.enum(["login", "signup", "reset"]),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const { channel, identifier, purpose } = body;

    if (purpose === "login") {
      const user =
        channel === "email"
          ? await findUserByEmail(identifier)
          : await findUserByPhone(identifier);
      if (!user || user.status !== "ACTIVE") {
        return apiError("No account found for this " + (channel === "email" ? "email" : "phone number"), 404, "NOT_FOUND");
      }
    }

    if (purpose === "reset" && channel === "email") {
      const user = await findUserByEmail(identifier);
      if (!user) return apiError("No account found for this email", 404, "NOT_FOUND");
    }

    const { code, expiresAt } = await createOtp(channel, identifier, purpose);

    if (devOtpEnabled()) {
      console.log(`[OTP ${purpose}] ${channel}=${identifier} code=${code}`);
    }

    const payload: { sent: boolean; expiresAt: string; devCode?: string } = {
      sent: true,
      expiresAt,
    };
    if (devOtpEnabled()) payload.devCode = code;

    return apiSuccess(payload);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Invalid request", 400, "VALIDATION_ERROR", error.flatten());
    console.error(error);
    return apiError("Failed to send OTP", 500);
  }
}

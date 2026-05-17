import { apiError, apiSuccess } from "@/lib/api/response";
import { verifyOtp } from "@/lib/auth/otp";
import { findUserByEmail } from "@/repositories/auth";
import { updateUserPassword } from "@/repositories/auth/users";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await findUserByEmail(body.email);
    if (!user) return apiError("No account found", 404);

    const verified = await verifyOtp("email", body.email, "reset", body.otp);
    if (!verified.ok) return apiError("Invalid or expired OTP", 400, "INVALID_OTP");

    await updateUserPassword(user.id, body.password);
    return apiSuccess({ reset: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
    return apiError("Reset failed", 500);
  }
}

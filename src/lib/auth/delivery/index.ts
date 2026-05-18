import type { OtpChannel, OtpPurpose } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/delivery/email";
import { sendOtpSms } from "@/lib/auth/delivery/sms";
import { devOtpEnabled } from "@/lib/auth/otp";

export async function deliverOtp(
  channel: OtpChannel,
  identifier: string,
  code: string,
  purpose: OtpPurpose
) {
  if (channel === "email") {
    return sendOtpEmail(identifier, code, purpose);
  }
  return sendOtpSms(identifier, code, purpose);
}

export function shouldLogDevOtp() {
  return devOtpEnabled();
}

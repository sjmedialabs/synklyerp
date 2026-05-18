import type { OtpPurpose } from "@/lib/auth/otp";

const PURPOSE_LABEL: Record<OtpPurpose, string> = {
  login: "sign in",
  signup: "verify your account",
  reset: "reset your password",
};

export async function sendOtpSms(to: string, code: string, purpose: OtpPurpose) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Twilio SMS is not configured");
    }
    return { delivered: false, provider: "none" as const };
  }

  const label = PURPOSE_LABEL[purpose];
  const body = `SynklyERP: Your code to ${label} is ${code}. Valid for 10 minutes.`;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SMS delivery failed: ${err}`);
  }

  return { delivered: true, provider: "twilio" as const };
}

import type { OtpPurpose } from "@/lib/auth/otp";

const PURPOSE_LABEL: Record<OtpPurpose, string> = {
  login: "sign in",
  signup: "complete your registration",
  reset: "reset your password",
};

export async function sendOtpEmail(to: string, code: string, purpose: OtpPurpose) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "SynklyERP <noreply@synklyerp.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    return { delivered: false, provider: "none" as const };
  }

  const label = PURPOSE_LABEL[purpose];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your SynklyERP verification code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1B1538">SynklyERP</h2>
          <p>Use this code to ${label}:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1B1538">${code}</p>
          <p style="color:#64748b;font-size:14px">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email delivery failed: ${err}`);
  }

  return { delivered: true, provider: "resend" as const };
}

export async function sendEmailVerificationLink(to: string, verifyUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "SynklyERP <noreply@synklyerp.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log(`[Email verification] ${to} -> ${verifyUrl}`);
    return { delivered: false, provider: "none" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Verify your SynklyERP email",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1B1538">Welcome to SynklyERP</h2>
          <p>Confirm your official email address to activate your account and start onboarding.</p>
          <p style="margin:24px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:#1B1538;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
              Verify email &amp; continue
            </a>
          </p>
          <p style="color:#64748b;font-size:14px">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email delivery failed: ${err}`);
  }

  return { delivered: true, provider: "resend" as const };
}

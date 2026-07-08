const API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v21.0";

export function whatsAppGraphUrl(path: string) {
  return `https://graph.facebook.com/${API_VERSION}/${path}`;
}

export function parseGraphApiError(json: unknown): string {
  const err = (json as { error?: { message?: string; error_user_msg?: string; code?: number; error_subcode?: number } })
    ?.error;
  if (!err) return "WhatsApp API request failed.";
  const msg = err.error_user_msg ?? err.message ?? "WhatsApp API request failed.";
  if (err.code === 100 || msg.includes("does not exist")) {
    return `${msg} Check that Phone number ID is correct (not WABA ID or App ID) and your access token has whatsapp_business_messaging permission.`;
  }
  if (
    err.code === 131047 ||
    err.code === 131026 ||
    err.error_subcode === 2494055 ||
    /24.?hour|re-engagement|template/i.test(msg)
  ) {
    return `${msg} WhatsApp only allows free-form replies within 24 hours of the customer's last message. After that, send an approved template message first.`;
  }
  return msg;
}

export type WhatsAppCredentialTestResult =
  | { ok: true; displayPhoneNumber: string | null; verifiedName: string | null }
  | { ok: false; message: string };

export async function testWhatsAppCredentials(input: {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string | null;
}): Promise<WhatsAppCredentialTestResult> {
  const res = await fetch(
    whatsAppGraphUrl(
      `${input.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`
    ),
    { headers: { Authorization: `Bearer ${input.accessToken}` } }
  );
  const json = await res.json();
  if (!res.ok) {
    return { ok: false, message: parseGraphApiError(json) };
  }

  const data = json as { display_phone_number?: string; verified_name?: string };
  const displayPhoneNumber = data.display_phone_number ?? null;
  const verifiedName = data.verified_name ?? null;

  if (input.businessAccountId?.trim()) {
    const listRes = await fetch(
      whatsAppGraphUrl(
        `${input.businessAccountId.trim()}/phone_numbers?fields=id,display_phone_number`
      ),
      { headers: { Authorization: `Bearer ${input.accessToken}` } }
    );
    const listJson = await listRes.json();
    if (!listRes.ok) {
      return { ok: false, message: parseGraphApiError(listJson) };
    }
    const phones = (listJson as { data?: { id: string }[] }).data ?? [];
    const match = phones.some((p) => p.id === input.phoneNumberId);
    if (!match) {
      return {
        ok: false,
        message:
          "Phone number ID does not belong to the Business account ID (WABA) you entered. Use the Phone number ID from WhatsApp → API Setup.",
      };
    }
  }

  return { ok: true, displayPhoneNumber, verifiedName };
}

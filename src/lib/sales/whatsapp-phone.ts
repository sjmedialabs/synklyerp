export type ParsedWhatsAppPhone = {
  valid: boolean;
  normalized: string;
  display: string;
  error?: string;
};

/** Normalize a phone string to E.164 digits (no +) for WhatsApp. */
export function parseWhatsAppPhone(phone: string, defaultCountryCode = "91"): ParsedWhatsAppPhone {
  const raw = phone.trim();
  if (!raw) {
    return { valid: false, normalized: "", display: "", error: "Phone number is required." };
  }

  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00") && digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Local 10-digit mobile (common in India)
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    digits = defaultCountryCode + digits;
  }

  if (digits.length < 8 || digits.length > 15) {
    return {
      valid: false,
      normalized: "",
      display: raw,
      error: "Enter a valid phone number with country code (e.g. +91 9876543210).",
    };
  }

  if (/^0/.test(digits)) {
    return {
      valid: false,
      normalized: "",
      display: raw,
      error: "Phone number cannot start with 0. Include the country code.",
    };
  }

  return { valid: true, normalized: digits, display: `+${digits}` };
}

export type WhatsAppValidationResult = {
  valid: boolean;
  onWhatsApp: boolean;
  normalized: string | null;
  display: string | null;
  message: string;
  verified: boolean;
};

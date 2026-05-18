export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export type PasswordCheck = {
  valid: boolean;
  strength: PasswordStrength;
  score: number;
  message: string;
  hints: string[];
};

export function evaluatePassword(password: string): PasswordCheck {
  const hints: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else hints.push("At least 8 characters");

  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else hints.push("Mix uppercase and lowercase letters");

  if (/\d/.test(password)) score += 1;
  else hints.push("Include a number");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else hints.push("Include a symbol");

  const strength: PasswordStrength =
    score <= 1 ? "weak" : score === 2 ? "fair" : score === 3 ? "good" : "strong";

  const valid = password.length >= 8 && score >= 2;

  return {
    valid,
    strength,
    score,
    message: valid ? "Password meets requirements" : "Password is too weak",
    hints,
  };
}

export function assertPasswordPolicy(password: string) {
  const result = evaluatePassword(password);
  if (!result.valid) {
    throw new Error(result.hints[0] ?? result.message);
  }
  return result;
}

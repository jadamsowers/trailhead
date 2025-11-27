// Lightweight phone validation helpers (no external deps)
// Accepts common US formats and international E.164 style

/**
 * Returns true when the input looks like a valid phone number.
 * Rules:
 * - If starts with '+', allow 10–15 digits total after '+'
 * - Otherwise allow 10 digits (US national) or 11 digits starting with leading '1'
 * - Non-digit separators like spaces, dashes, parentheses, and dots are ignored
 */
export function isValidPhone(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    // International number: require 10–15 digits after '+'
    return digits.length >= 10 && digits.length <= 15;
  }

  // US-style national formats
  if (digits.length === 10) return true; // e.g., (555) 555-1234
  if (digits.length === 11 && digits.startsWith("1")) return true; // e.g., 1-555-555-1234

  return false;
}

/**
 * Optionally normalize to a compact form (digits only, preserve leading '+').
 * Not currently used to mutate outbound payload, but handy if needed later.
 */
export function normalizePhone(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (trimmed.startsWith("+")) {
    const plusDigits = "+" + trimmed.replace(/[^\d]/g, "");
    return plusDigits;
  }
  return trimmed.replace(/\D/g, "");
}

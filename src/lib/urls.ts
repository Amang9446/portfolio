/**
 * Validates and sanitizes URLs to ensure they use http: or https: schemes,
 * preventing javascript:, data:, and other unsafe protocols from being
 * persisted or rendered as active links.
 */
export function sanitizeHttpUrl(
  value: unknown,
  options?: { allowRelative?: boolean },
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (options?.allowRelative && trimmed.startsWith("/")) {
    // Disallow protocol-relative URLs (//example.com) and backslash paths (/\\...)
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/\\") ||
      trimmed.includes("\\")
    ) {
      return null;
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseDimension(raw, locale = navigator.language || "en-US") {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return NaN;

  // Get the decimal separator for the current locale
  const numberFormat = new Intl.NumberFormat(locale);
  const parts = numberFormat.formatToParts(1.1);
  const decimalSymbol = parts.find((p) => p.type === "decimal")?.value || ".";

  // Normalize user input:
  // Remove spaces, replace locale-specific decimal with "."
  const normalized = raw
    .trim()
    .replace(/\s/g, "")
    .replace(new RegExp(`\\${decimalSymbol}`, "g"), ".")
    .replace(",", "."); // fallback for some locales

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Validates a dimension value is within allowed range.
 */
export function validateDimension(n, min, max) {
  return Number.isFinite(n) && n >= min && n <= max;
}

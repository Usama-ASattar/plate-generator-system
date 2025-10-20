import { useMemo } from "react";

export const cn = (...a) => a.filter(Boolean).join(" ");

/* unit helpers */
export const CM_PER_IN = 2.54;
export const toInches = (cm) => (Number(cm) || 0) / CM_PER_IN;
export const toCm = (inch) => (Number(inch) || 0) * CM_PER_IN;

/* locale helpers */
const getLocale = () =>
  typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en-US";

export const useLocale = () => useMemo(getLocale, []);

/* format a number for display in the current locale */
export const fmt = (n, locale, maxFrac = 2) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxFrac,
  }).format(Number(n) || 0);

/* parse a user number string in a locale friendly way */
export function parseLocaleNumber(str) {
  if (str == null) return NaN;
  const s = String(str)
    .trim()
    .replace(/\u00a0/g, " ")
    .replace(/\s/g, "")
    .replace(",", ".");
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : NaN;
}

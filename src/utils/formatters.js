export function formatNumber(value) {
  return Number(value || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function normalizePostcode(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function isPotentialUkPostcode(value) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\d?[A-Z]{0,2}$/.test(normalizePostcode(value));
}

export function isFullUkPostcode(value) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(normalizePostcode(value));
}

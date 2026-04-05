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

export function normalizePersonName(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, (match) => match.toUpperCase());
}

export function normalizeLicenceNumber(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 30);
}

export function normalizePlateNumber(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 20);
}

export function isApprovedOption(value, options) {
  return options.some(
    (option) => option.toLowerCase() === value.trim().toLowerCase()
  );
}

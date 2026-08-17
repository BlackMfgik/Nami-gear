export function normalizeUkrainianPhone(value: string) {
  const digits = value.trim();
  if (!/^[0-9]+$/.test(digits)) return "";
  if (/^380[0-9]{9}$/.test(digits)) return `+${digits}`;
  if (/^0[0-9]{9}$/.test(digits)) return `+38${digits}`;
  return "";
}

export function isValidEmail(value: string) {
  if (!value) return true;
  return value.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

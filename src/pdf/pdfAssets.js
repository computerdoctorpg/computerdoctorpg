export const PDF_COLORS = {
  green: '#16a34a',
  greenDark: '#14532d',
  black: '#111111',
  tint: '#f0faf4',
  line: '#cbd5e1',
  gray: '#4b5563',
  grayLight: '#6b7280',
};

export function getAssetUrl(path) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export function formatTicketDate(dateStr, locale = 'sr-RS') {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function displayVal(value, noneLabel = 'NEMA') {
  if (!value || value === 'NEMA' || value === '-') return noneLabel;
  return String(value);
}

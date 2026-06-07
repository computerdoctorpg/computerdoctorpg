const OPERATER_EMAIL_DOMAIN = 'servis.local';

export const normalizeOperatorUsername = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

export const usernameToOperatorEmail = (username) => {
  const slug = normalizeOperatorUsername(username);
  if (!slug) return '';
  return `operater.${slug}@${OPERATER_EMAIL_DOMAIN}`;
};

export const resolveLoginEmail = (login) => {
  const trimmed = String(login || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  return usernameToOperatorEmail(trimmed);
};

export const getOperatorDisplayName = (user) => {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  const email = user.email || '';
  const match = email.match(/^operater\.(.+)@servis\.local$/i);
  if (match) {
    return match[1]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return email;
};

export const isOperatorInternalEmail = (email) =>
  /^operater\.[^@]+@servis\.local$/i.test(String(email || '').trim());

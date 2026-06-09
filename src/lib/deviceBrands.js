export const DEVICE_BRANDS = [
  { id: 'apple', label: 'Apple', iconSlug: 'apple', aliases: ['macbook'] },
  { id: 'asus', label: 'Asus', iconSlug: 'asus' },
  { id: 'dell', label: 'Dell', iconSlug: 'dell' },
  { id: 'hp', label: 'HP', iconSlug: 'hp', aliases: ['hewlett-packard'] },
  { id: 'lenovo', label: 'Lenovo', iconSlug: 'lenovo', aliases: ['thinkpad', 'ideapad', 'legion'] },
  { id: 'acer', label: 'Acer', iconSlug: 'acer', aliases: ['predator', 'aspire', 'travelmate'] },
  { id: 'msi', label: 'MSI', iconSlug: 'msi' },
  { id: 'microsoft', label: 'Microsoft', iconSlug: 'microsoft', aliases: ['surface'] },
  { id: 'samsung', label: 'Samsung', iconSlug: 'samsung' },
  { id: 'toshiba', label: 'Toshiba', iconSlug: 'toshiba', aliases: ['satellite', 'portege'] },
  { id: 'huawei', label: 'Huawei', iconSlug: 'huawei' },
  { id: 'honor', label: 'Honor', iconSlug: 'honor' },
  { id: 'lg', label: 'LG', iconSlug: 'lg' },
  { id: 'gigabyte', label: 'Gigabyte' },
  { id: 'razer', label: 'Razer', iconSlug: 'razer' },
  { id: 'sony', label: 'Sony', iconSlug: 'sony', aliases: ['vaio'] },
  { id: 'fujitsu', label: 'Fujitsu', iconSlug: 'fujitsu' },
];

export const OTHER_BRAND_LABEL = 'Ostalo';

export function getBrandInfo(brandName) {
  if (!brandName?.trim()) return null;
  const norm = brandName.trim().toLowerCase();

  const exact = DEVICE_BRANDS.find(
    (b) => b.label.toLowerCase() === norm || b.id === norm,
  );
  if (exact) return exact;

  const byAlias = DEVICE_BRANDS.find((b) =>
    (b.aliases || []).some((alias) => norm === alias || norm.startsWith(`${alias} `)),
  );
  if (byAlias) return byAlias;

  return { id: 'other', label: brandName.trim(), iconSlug: null };
}

export function getBrandLogoUrl(brandName) {
  const info = getBrandInfo(brandName);
  if (!info?.iconSlug) return null;
  return `https://cdn.simpleicons.org/${info.iconSlug}/ffffff`;
}

export function combineDeviceName(brand, model) {
  const b = (brand || '').trim();
  const m = (model || '').trim();
  if (b && m) return `${b} ${m}`;
  return b || m || '';
}

export function splitDeviceFields(deviceName) {
  if (!deviceName?.trim()) {
    return { deviceBrand: '', deviceModel: '' };
  }

  const normalized = deviceName.trim();
  const lower = normalized.toLowerCase();

  for (const brand of DEVICE_BRANDS) {
    const labelLower = brand.label.toLowerCase();
    if (lower === labelLower || lower.startsWith(`${labelLower} `)) {
      return {
        deviceBrand: brand.label,
        deviceModel: normalized.slice(brand.label.length).trim(),
      };
    }
    for (const alias of brand.aliases || []) {
      if (lower === alias || lower.startsWith(`${alias} `)) {
        const aliasLen = normalized.toLowerCase().indexOf(alias) === 0
          ? alias.length
          : brand.label.length;
        return {
          deviceBrand: brand.label,
          deviceModel: normalized.slice(aliasLen).trim(),
        };
      }
    }
  }

  const parts = normalized.split(/\s+/);
  return {
    deviceBrand: parts[0] || '',
    deviceModel: parts.slice(1).join(' '),
  };
}

export function getAllBrandFilterOptions(tickets = []) {
  const brands = new Map();
  DEVICE_BRANDS.forEach((b) => brands.set(b.label.toLowerCase(), b.label));
  tickets.forEach((ticket) => {
    const { brand } = splitDeviceFields(ticket.deviceName);
    if (brand) brands.set(brand.toLowerCase(), brand);
  });
  return Array.from(brands.values()).sort((a, b) => a.localeCompare(b, 'sr'));
}

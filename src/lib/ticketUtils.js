import {
  splitDeviceFields,
  getAllBrandFilterOptions,
} from '@/lib/deviceBrands';

const normalizePhone = (phone) => (phone || '').replace(/\D/g, '');

const normalizeText = (value) => (value || '').toLowerCase().trim();

export const parseDeviceBrandModel = (deviceName) => {
  const { deviceBrand, deviceModel } = splitDeviceFields(deviceName);
  return { brand: deviceBrand, model: deviceModel };
};

export const getUniqueBrands = (tickets) => getAllBrandFilterOptions(tickets);

export const ticketMatchesBrandModel = (ticket, brandFilter, modelFilter) => {
  if (!brandFilter?.trim() && !modelFilter?.trim()) return true;
  if (!ticket) return false;

  const { brand, model } = parseDeviceBrandModel(ticket.deviceName);
  const fullName = normalizeText(ticket.deviceName);
  const brandNorm = normalizeText(brand);
  const modelNorm = normalizeText(model);

  if (brandFilter?.trim()) {
    const term = normalizeText(brandFilter);
    const match =
      brandNorm === term ||
      brandNorm.includes(term) ||
      fullName.includes(term);
    if (!match) return false;
  }

  if (modelFilter?.trim()) {
    const term = normalizeText(modelFilter);
    const match =
      modelNorm.includes(term) ||
      fullName.includes(term);
    if (!match) return false;
  }

  return true;
};

export const ticketMatchesSearch = (ticket, searchTerm) => {
  if (!searchTerm.trim()) return true;
  if (!ticket) return false;

  const term = normalizeText(searchTerm);
  const termDigits = normalizePhone(searchTerm);
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName);

  const textFields = [
    ticket.id,
    ticket.customerName,
    ticket.customerSurname,
    `${ticket.customerName || ''} ${ticket.customerSurname || ''}`,
    ticket.customerEmail,
    ticket.customerPhone,
    ticket.deviceName,
    brand,
    model,
    `${brand} ${model}`.trim(),
    ticket.deviceSerial,
    ticket.batterySerial,
    ticket.chargerSerial,
    ticket.issueDescription,
    ticket.notes,
    ticket.repairDetails,
    ticket.partsUsed,
    ticket.dispatchNoteNumber,
    ticket.bagDescription,
    ticket.osPassword,
  ];

  const matchesText = textFields.some((field) =>
    normalizeText(field).includes(term)
  );

  if (matchesText) return true;

  if (termDigits.length >= 3) {
    const phoneDigits = normalizePhone(ticket.customerPhone);
    if (phoneDigits.includes(termDigits)) return true;
  }

  return false;
};

export const formatDayLabel = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Danas';
  if (isSameDay(date, yesterday)) return 'Juče';

  return date.toLocaleDateString('sr-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
};

export const getMonthKey = (dateString) => {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const getDayKey = (dateString) => {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatShortDayLabel = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' });
};

export const formatWeekdayShort = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Danas';
  if (isSameDay(date, yesterday)) return 'Juče';

  return date.toLocaleDateString('sr-RS', { weekday: 'short' });
};

export const groupTicketsByDay = (tickets) => {
  const dayMap = new Map();

  tickets.forEach((ticket) => {
    const dayKey = getDayKey(ticket.createdAt);
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey).push(ticket);
  });

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayTickets]) => ({
      dayKey,
      monthKey: getMonthKey(dayTickets[0]?.createdAt),
      dayLabel: formatDayLabel(dayTickets[0]?.createdAt),
      shortDayLabel: formatShortDayLabel(dayTickets[0]?.createdAt),
      weekdayLabel: formatWeekdayShort(dayTickets[0]?.createdAt),
      dayNumber: dayTickets[0]?.createdAt
        ? new Date(dayTickets[0].createdAt).getDate()
        : '',
      monthShort: dayTickets[0]?.createdAt
        ? new Date(dayTickets[0].createdAt).toLocaleDateString('sr-RS', { month: 'short' })
        : '',
      tickets: dayTickets,
    }));
};

export const groupTicketsByMonthAndDay = (tickets) => {
  const monthMap = new Map();

  tickets.forEach((ticket) => {
    const monthKey = getMonthKey(ticket.createdAt);
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, new Map());
    }

    const dayKey = getDayKey(ticket.createdAt);
    const dayMap = monthMap.get(monthKey);
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, []);
    }
    dayMap.get(dayKey).push(ticket);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, dayMap]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      days: Array.from(dayMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dayKey, dayTickets]) => ({
          dayKey,
          dayLabel: formatDayLabel(dayTickets[0]?.createdAt),
          tickets: dayTickets,
        })),
    }));
};

export const buildClientSummaries = (tickets) => {
  const clientMap = new Map();

  tickets.forEach((ticket) => {
    const key = ticket.clientId || ticket.customerPhone || `${ticket.customerName}-${ticket.customerSurname}`;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientId: ticket.clientId,
        customerName: ticket.customerName,
        customerSurname: ticket.customerSurname,
        customerPhone: ticket.customerPhone,
        customerEmail: ticket.customerEmail,
        isWarrantyClient: ticket.isWarrantyClient || ticket.isWarranty || false,
        tickets: [],
      });
    }
    const client = clientMap.get(key);
    if (ticket.isWarrantyClient || ticket.isWarranty) {
      client.isWarrantyClient = true;
    }
    client.tickets.push(ticket);
  });

  return Array.from(clientMap.values())
    .map((client) => {
      const sortedTickets = [...client.tickets].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const devices = [...new Set(sortedTickets.map((t) => t.deviceName).filter(Boolean))];

      return {
        ...client,
        tickets: sortedTickets,
        ticketCount: sortedTickets.length,
        lastVisit: sortedTickets[0]?.createdAt,
        devices,
      };
    })
    .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
};

export const getClientTicketCounts = (tickets) => {
  const counts = {};
  tickets.forEach((ticket) => {
    const key = ticket.clientId || ticket.customerPhone;
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

export const formatDayKeyDisplay = (dayKey) => {
  const [year, month, day] = dayKey.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return date.toLocaleDateString('sr-RS', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const exportClientsToCsv = (clients) => {
  const headers = ['Ime', 'Prezime', 'Telefon', 'Email', 'Broj naloga', 'Poslednja poseta', 'Uređaji'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const rows = clients.map((client) => [
    client.customerName,
    client.customerSurname,
    client.customerPhone,
    client.customerEmail || '',
    client.ticketCount,
    client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('sr-RS') : '',
    client.devices.join('; '),
  ]);

  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `klijenti-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const clientMatchesSearch = (client, searchTerm) => {
  if (!searchTerm.trim()) return true;

  const term = normalizeText(searchTerm);
  const termDigits = normalizePhone(searchTerm);

  const textFields = [
    client.customerName,
    client.customerSurname,
    `${client.customerName || ''} ${client.customerSurname || ''}`,
    client.customerEmail,
    client.customerPhone,
    ...client.devices,
    ...client.tickets.flatMap((t) => [
      t.id,
      t.deviceSerial,
      t.batterySerial,
      t.chargerSerial,
      t.deviceName,
    ]),
  ];

  if (textFields.some((field) => normalizeText(field).includes(term))) {
    return true;
  }

  if (termDigits.length >= 3) {
    return normalizePhone(client.customerPhone).includes(termDigits);
  }

  return false;
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'recycle-bin.json');
const MAX_TICKETS = 500;

const emptyStore = () => ({ tickets: [] });

const readStore = () => {
  try {
    if (!fs.existsSync(STORE_FILE)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    return {
      tickets: Array.isArray(parsed?.tickets) ? parsed.tickets : [],
    };
  } catch {
    return emptyStore();
  }
};

const writeStore = (store) => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
};

export const getCloudDeletedIds = () =>
  readStore()
    .tickets.map((ticket) => ticket.id)
    .filter(Boolean);

export const getCloudRecycleBinTickets = () =>
  [...readStore().tickets].sort(
    (a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0)
  );

export const addCloudDeletedTicket = (ticket) => {
  if (!ticket?.id) throw new Error('Nalog nema ID.');

  const store = readStore();
  const tickets = store.tickets.filter((item) => item.id !== ticket.id);
  tickets.unshift({
    ...ticket,
    deletedAt: ticket.deletedAt || new Date().toISOString(),
    recycleSource: 'cloud',
  });

  writeStore({ tickets: tickets.slice(0, MAX_TICKETS) });
  return tickets[0];
};

export const removeCloudDeletedTicket = (ticketId) => {
  const store = readStore();
  const next = store.tickets.filter((ticket) => ticket.id !== ticketId);
  writeStore({ tickets: next });
  return next.length !== store.tickets.length;
};

export const syncCloudRecycleBinTickets = (tickets = []) => {
  if (!Array.isArray(tickets) || tickets.length === 0) return 0;

  const store = readStore();
  const byId = new Map(store.tickets.map((ticket) => [ticket.id, ticket]));

  tickets.forEach((ticket) => {
    if (!ticket?.id) return;
    byId.set(ticket.id, {
      ...ticket,
      deletedAt: ticket.deletedAt || new Date().toISOString(),
      recycleSource: ticket.recycleSource || 'cloud',
    });
  });

  const merged = [...byId.values()]
    .sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0))
    .slice(0, MAX_TICKETS);

  writeStore({ tickets: merged });
  return merged.length;
};

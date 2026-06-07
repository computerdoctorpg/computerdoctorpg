const DELETED_IDS_KEY = 'pc_servis_deleted_ticket_ids';
const DELETED_TICKETS_KEY = 'pc_servis_recycle_bin_tickets';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getLocallyDeletedIds = () => new Set(readJson(DELETED_IDS_KEY, []));

export const getLocalRecycleBinTickets = () => readJson(DELETED_TICKETS_KEY, []);

export const markTicketDeletedLocally = (ticket) => {
  if (!ticket?.id) return;

  const ids = getLocallyDeletedIds();
  ids.add(ticket.id);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]));

  const tickets = getLocalRecycleBinTickets().filter((t) => t.id !== ticket.id);
  tickets.unshift({
    ...ticket,
    deletedAt: new Date().toISOString(),
    recycleSource: 'local',
  });
  localStorage.setItem(DELETED_TICKETS_KEY, JSON.stringify(tickets.slice(0, 200)));
};

export const restoreTicketLocally = (ticketId) => {
  const ids = getLocallyDeletedIds();
  ids.delete(ticketId);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]));

  const tickets = getLocalRecycleBinTickets().filter((t) => t.id !== ticketId);
  localStorage.setItem(DELETED_TICKETS_KEY, JSON.stringify(tickets));
};

export const removeFromLocalRecycleBin = (ticketId) => {
  restoreTicketLocally(ticketId);
};

export const filterOutLocallyDeleted = (tickets) => {
  const ids = getLocallyDeletedIds();
  if (ids.size === 0) return tickets;
  return tickets.filter((t) => !ids.has(t.id));
};

export const mergeRecycleBinTickets = (dbTickets, localTickets) => {
  const byId = new Map();
  [...localTickets, ...dbTickets].forEach((ticket) => {
    if (ticket?.id) byId.set(ticket.id, ticket);
  });
  return [...byId.values()].sort(
    (a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0)
  );
};

export const clearLocalRecycleBin = () => {
  localStorage.removeItem(DELETED_IDS_KEY);
  localStorage.removeItem(DELETED_TICKETS_KEY);
};

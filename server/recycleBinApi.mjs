import { createClient } from '@supabase/supabase-js';
import { readJsonBody, verifyAuthToken } from './emailApi.mjs';
import {
  addCloudDeletedTicket,
  getCloudDeletedIds,
  getCloudRecycleBinTickets,
  removeCloudDeletedTicket,
  syncCloudRecycleBinTickets,
} from './recycleBinStore.mjs';

async function verifyAdmin(authHeader) {
  const user = await verifyAuthToken(authHeader);
  if (!user) return null;

  const isAdminEmail = user.email?.toLowerCase() === 'prodaja@computer-doctor.me';
  if (isAdminEmail) return user;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) return null;

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin') return user;
  return null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export async function handleRecycleBin(req, res, urlPath) {
  try {
    if (req.method === 'GET' && urlPath === '/api/recycle-bin/ids') {
      const user = await verifyAuthToken(req.headers.authorization);
      if (!user) {
        sendJson(res, 401, { error: 'Morate biti ulogovani.' });
        return;
      }

      sendJson(res, 200, { deletedIds: getCloudDeletedIds() });
      return;
    }

    if (req.method === 'GET' && urlPath === '/api/recycle-bin') {
      const admin = await verifyAdmin(req.headers.authorization);
      if (!admin) {
        sendJson(res, 403, { error: 'Samo administrator može vidjeti korpu.' });
        return;
      }

      sendJson(res, 200, {
        tickets: getCloudRecycleBinTickets(),
        deletedIds: getCloudDeletedIds(),
      });
      return;
    }

    if (req.method === 'POST' && urlPath === '/api/recycle-bin') {
      const admin = await verifyAdmin(req.headers.authorization);
      if (!admin) {
        sendJson(res, 403, { error: 'Samo administrator može brisati naloge.' });
        return;
      }

      const body = await readJsonBody(req);
      const action = body.action || 'delete';

      if (action === 'delete') {
        if (!body.ticket?.id) {
          sendJson(res, 400, { error: 'Nedostaju podaci o nalogu.' });
          return;
        }
        const saved = addCloudDeletedTicket(body.ticket);
        sendJson(res, 200, { ok: true, ticket: saved });
        return;
      }

      if (action === 'restore') {
        const ticketId = body.ticketId || body.ticket?.id;
        if (!ticketId) {
          sendJson(res, 400, { error: 'Nedostaje ID naloga.' });
          return;
        }
        removeCloudDeletedTicket(ticketId);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (action === 'sync') {
        const count = syncCloudRecycleBinTickets(body.tickets || []);
        sendJson(res, 200, { ok: true, count });
        return;
      }

      sendJson(res, 400, { error: 'Nepoznata akcija.' });
      return;
    }

    if (req.method === 'DELETE' && urlPath === '/api/recycle-bin') {
      const admin = await verifyAdmin(req.headers.authorization);
      if (!admin) {
        sendJson(res, 403, { error: 'Samo administrator može uklanjati naloge iz korpe.' });
        return;
      }

      const body = await readJsonBody(req);
      const ticketId = body.ticketId;
      if (!ticketId) {
        sendJson(res, 400, { error: 'Nedostaje ID naloga.' });
        return;
      }

      removeCloudDeletedTicket(ticketId);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Recycle bin API error:', error);
    sendJson(res, 500, { error: error.message || 'Greška u korpi.' });
  }
}

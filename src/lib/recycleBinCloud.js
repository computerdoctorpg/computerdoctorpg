import { supabase } from '@/lib/customSupabaseClient';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) return null;
  return data.session.access_token;
}

async function cloudFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Niste ulogovani.');

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Cloud korpa nije dostupna.');
  }

  return payload;
}

let cloudAvailableCache = null;

export const probeCloudRecycleBin = async () => {
  if (cloudAvailableCache !== null) return cloudAvailableCache;

  try {
    const token = await getAccessToken();
    if (!token) {
      cloudAvailableCache = false;
      return false;
    }

    const response = await fetch('/api/recycle-bin/ids', {
      headers: { Authorization: `Bearer ${token}` },
    });

    cloudAvailableCache = response.ok;
  } catch {
    cloudAvailableCache = false;
  }

  return cloudAvailableCache;
};

export const resetCloudRecycleBinProbe = () => {
  cloudAvailableCache = null;
};

export const fetchCloudDeletedIds = async () => {
  const payload = await cloudFetch('/api/recycle-bin/ids');
  return Array.isArray(payload.deletedIds) ? payload.deletedIds : [];
};

export const fetchCloudRecycleBinTickets = async () => {
  const payload = await cloudFetch('/api/recycle-bin');
  return Array.isArray(payload.tickets) ? payload.tickets : [];
};

export const cloudMarkDeleted = async (ticket) => {
  const payload = await cloudFetch('/api/recycle-bin', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', ticket }),
  });
  resetCloudRecycleBinProbe();
  return payload.ticket;
};

export const cloudRestoreDeleted = async (ticketId) => {
  await cloudFetch('/api/recycle-bin', {
    method: 'POST',
    body: JSON.stringify({ action: 'restore', ticketId }),
  });
  resetCloudRecycleBinProbe();
};

export const cloudRemoveDeleted = async (ticketId) => {
  await cloudFetch('/api/recycle-bin', {
    method: 'DELETE',
    body: JSON.stringify({ ticketId }),
  });
  resetCloudRecycleBinProbe();
};

export const syncTicketsToCloudRecycleBin = async (tickets) => {
  if (!tickets?.length) return 0;
  const payload = await cloudFetch('/api/recycle-bin', {
    method: 'POST',
    body: JSON.stringify({ action: 'sync', tickets }),
  });
  resetCloudRecycleBinProbe();
  return payload.count ?? tickets.length;
};

export const getRecycleBinMode = async (dbSupported) => {
  if (dbSupported) return 'database';
  const cloudOk = await probeCloudRecycleBin();
  if (cloudOk) return 'cloud';
  return 'local';
};

import { createClient } from '@supabase/supabase-js';
import { readJsonBody, verifyAuthToken } from './emailApi.mjs';

const BACKUP_TABLES = [
  'parts_categories',
  'parts',
  'clients',
  'tickets',
  'parts_sales',
  'parts_sales_new',
  'users',
];

function getSupabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return { url, anonKey, serviceKey };
}

async function verifyAdmin(authHeader) {
  const user = await verifyAuthToken(authHeader);
  if (!user) return null;

  const isAdminEmail = user.email?.toLowerCase() === 'prodaja@computer-doctor.me';
  const { url, serviceKey } = getSupabaseConfig();

  if (!serviceKey) {
    if (isAdminEmail) return user;
    return null;
  }

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin' || isAdminEmail) {
    return user;
  }

  return null;
}

function getAdminClient() {
  const { url, serviceKey } = getSupabaseConfig();
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nije podešen na serveru.');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchAllRows(client, table) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function fetchAuthUsers(adminClient) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const batch = data?.users || [];
    users.push(
      ...batch.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
      }))
    );

    if (batch.length < 1000) break;
    page += 1;
  }

  return users;
}

function formatFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `computer-doctor-backup-${stamp}.json`;
}

export async function handleBackup(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const adminUser = await verifyAdmin(req.headers.authorization);
    if (!adminUser) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Samo administrator može preuzeti backup.' }));
      return;
    }

    let body = {};
    try {
      body = await readJsonBody(req);
    } catch {
      body = {};
    }

    const adminClient = getAdminClient();
    const database = {};
    const errors = [];

    for (const table of BACKUP_TABLES) {
      try {
        database[table] = await fetchAllRows(adminClient, table);
      } catch (error) {
        database[table] = [];
        errors.push({ table, message: error.message });
      }
    }

    let authUsers = [];
    try {
      authUsers = await fetchAuthUsers(adminClient);
    } catch (error) {
      errors.push({ table: 'auth.users', message: error.message });
    }

    const counts = Object.fromEntries(
      BACKUP_TABLES.map((table) => [table, database[table]?.length ?? 0])
    );
    counts.authUsers = authUsers.length;

    const backup = {
      meta: {
        version: 1,
        app: 'pc-servis-admin',
        createdAt: new Date().toISOString(),
        createdBy: adminUser.email,
        source: 'server',
        includesAuthUsers: authUsers.length > 0,
      },
      counts,
      database,
      authUsers,
      errors: errors.length ? errors : undefined,
    };

    const filename = formatFilename();
    const json = JSON.stringify(backup, null, 2);

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.end(json);
  } catch (error) {
    console.error('Backup API error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Greška pri kreiranju backupa.' }));
  }
}

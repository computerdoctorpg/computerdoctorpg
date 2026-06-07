import { createClient } from '@supabase/supabase-js';
import { readJsonBody } from './emailApi.mjs';

const OPERATER_EMAIL_DOMAIN = 'servis.local';

const normalizeOperatorUsername = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

const usernameToOperatorEmail = (username) => {
  const slug = normalizeOperatorUsername(username);
  if (!slug) return '';
  return `operater.${slug}@${OPERATER_EMAIL_DOMAIN}`;
};

function getSupabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return { url, anonKey, serviceKey };
}

async function verifyAdmin(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { url, anonKey, serviceKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;

  const authClient = createClient(url, anonKey);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  const isAdminEmail = user.email?.toLowerCase() === 'prodaja@computer-doctor.me';

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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nije podešen na serveru. Dodajte ga u .env.');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function upsertOperatorProfile(adminClient, userId, email, displayName) {
  const payload = {
    id: userId,
    email,
    role: 'operater',
    display_name: displayName,
  };

  const { error } = await adminClient.from('users').upsert(payload, { onConflict: 'id' });
  if (error && /display_name/.test(error.message || '')) {
    const { error: fallbackError } = await adminClient.from('users').upsert(
      { id: userId, email, role: 'operater' },
      { onConflict: 'id' }
    );
    if (fallbackError) throw fallbackError;
    return;
  }
  if (error) throw error;
}

export async function handleAdminUsers(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const adminUser = await verifyAdmin(req.headers.authorization);
    if (!adminUser) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Samo administrator može upravljati operaterima.' }));
      return;
    }

    const body = await readJsonBody(req);
    const action = body.action || 'create';

    if (action === 'create') {
      const displayName = String(body.displayName || body.name || '').trim();
      const password = String(body.password || '');

      if (!displayName || displayName.length < 2) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Ime operatera mora imati bar 2 karaktera.' }));
        return;
      }

      if (password.length < 6) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Lozinka mora imati bar 6 karaktera.' }));
        return;
      }

      const email = usernameToOperatorEmail(displayName);
      if (!email) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Neispravno ime operatera.' }));
        return;
      }

      const adminClient = getAdminClient();

      const { data: existingProfile } = await adminClient
        .from('users')
        .select('id, email, display_name')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: `Operater "${displayName}" već postoji.` }));
        return;
      }

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName, role: 'operater' },
      });

      if (createError) throw createError;

      await upsertOperatorProfile(adminClient, created.user.id, email, displayName);

      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        user: {
          id: created.user.id,
          email,
          displayName,
          role: 'operater',
        },
        loginHint: displayName,
      }));
      return;
    }

    if (action === 'delete') {
      const userId = body.userId;
      if (!userId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Nedostaje ID korisnika.' }));
        return;
      }

      const adminClient = getAdminClient();

      const { data: profile } = await adminClient
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Korisnik nije pronađen.' }));
        return;
      }

      if (profile.role === 'admin' || profile.email === 'prodaja@computer-doctor.me') {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Admin nalog se ne može obrisati.' }));
        return;
      }

      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthError) throw deleteAuthError;

      await adminClient.from('users').delete().eq('id', userId);

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Nepoznata akcija.' }));
  } catch (error) {
    console.error('Admin users API error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message || 'Greška pri upravljanju korisnicima.' }));
  }
}

import { createClient } from '@supabase/supabase-js';
import { readJsonBody, sendOperaterWelcomeEmail, isEmailConfigured } from './emailApi.mjs';

const ADMIN_EMAIL = 'prodaja@computer-doctor.me';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const displayNameFromEmail = (email) => {
  const local = email.split('@')[0] || '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
  const isAdminEmail = user.email?.toLowerCase() === ADMIN_EMAIL;

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
    return null;
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
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const displayName = String(body.displayName || body.name || '').trim() || displayNameFromEmail(email);
      const sendWelcomeEmail = body.sendWelcomeEmail !== false;

      if (!isValidEmail(email)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Unesite ispravnu email adresu zaposlenog.' }));
        return;
      }

      if (email === ADMIN_EMAIL) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Admin email se ne može koristiti za operatera.' }));
        return;
      }

      if (password.length < 6) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Lozinka mora imati bar 6 karaktera.' }));
        return;
      }

      if (sendWelcomeEmail && !isEmailConfigured()) {
        res.writeHead(503);
        res.end(JSON.stringify({
          error: 'SMTP nije podešen. Dodajte SMTP varijable na serveru ili isključite slanje emaila.',
        }));
        return;
      }

      const adminClient = getAdminClient();
      if (!adminClient) {
        res.writeHead(503);
        res.end(JSON.stringify({
          error: 'MISSING_SERVICE_ROLE_KEY',
          message: 'Dodajte SUPABASE_SERVICE_ROLE_KEY u .env / Hostinger.',
        }));
        return;
      }

      const { data: existingProfile } = await adminClient
        .from('users')
        .select('id, email, display_name')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: `Nalog sa emailom "${email}" već postoji.` }));
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

      let emailSent = false;
      let emailError = null;

      if (sendWelcomeEmail) {
        try {
          await sendOperaterWelcomeEmail({ to: email, displayName, password });
          emailSent = true;
        } catch (error) {
          emailError = error.message || 'Greška pri slanju emaila.';
          console.error('Operater welcome email error:', error);
        }
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        user: {
          id: created.user.id,
          email,
          displayName,
          role: 'operater',
        },
        loginHint: email,
        emailSent,
        emailError,
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
      if (!adminClient) {
        res.writeHead(503);
        res.end(JSON.stringify({
          error: 'Brisanje zahtijeva SUPABASE_SERVICE_ROLE_KEY na serveru.',
        }));
        return;
      }

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

      if (profile.role === 'admin' || profile.email === ADMIN_EMAIL) {
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

import { supabase } from '@/lib/customSupabaseClient';

async function upsertOperatorProfile(userId, email, displayName) {
  const profilePayload = {
    id: userId,
    email,
    role: 'operater',
    display_name: displayName,
  };

  let { error: profileError } = await supabase
    .from('users')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileError && /display_name/.test(profileError.message || '')) {
    ({ error: profileError } = await supabase.from('users').upsert(
      { id: userId, email, role: 'operater' },
      { onConflict: 'id' }
    ));
  }

  return profileError;
}

const SERVICE_KEY_ERROR =
  'Kreiranje operatera zahtijeva SUPABASE_SERVICE_ROLE_KEY u .env (lokalno) ili na Hostingeru. ' +
  'Bez toga Supabase šalje potvrdu na lažne adrese (operater.x@computerdoctor.in) i blokira projekat.';

export async function createOperatorAccount(displayName, password) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('Sesija nije pronađena. Molimo prijavite se ponovo.');
  }

  const response = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({
      action: 'create',
      displayName,
      password,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (response.ok && payload?.ok) {
    const profileError = await upsertOperatorProfile(
      payload.user.id,
      payload.user.email,
      payload.user.displayName || displayName
    );
    if (profileError) {
      console.warn('Operater kreiran, profil nije ažuriran:', profileError.message);
    }
    return payload;
  }

  if (payload?.error === 'MISSING_SERVICE_ROLE_KEY') {
    throw new Error(SERVICE_KEY_ERROR);
  }

  throw new Error(payload.error || SERVICE_KEY_ERROR);
}

export async function deleteOperatorAccount(userId) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('Sesija nije pronađena. Molimo prijavite se ponovo.');
  }

  const response = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({
      action: 'delete',
      userId,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || SERVICE_KEY_ERROR);
  }

  return payload;
}

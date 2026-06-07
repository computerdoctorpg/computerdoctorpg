import { supabase } from '@/lib/customSupabaseClient';

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
  if (!response.ok) {
    throw new Error(payload.error || 'Neuspešno kreiranje operatera.');
  }

  return payload;
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
    throw new Error(payload.error || 'Neuspešno brisanje operatera.');
  }

  return payload;
}

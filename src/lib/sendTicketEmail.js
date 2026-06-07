import { supabase } from '@/lib/customSupabaseClient';

async function getValidAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('Morate biti ulogovani da biste poslali email.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData?.session?.access_token) {
      throw new Error('Sesija je istekla. Odjavite se i ponovo se prijavite.');
    }
    return refreshData.session.access_token;
  }

  return session.access_token;
}

export async function sendTicketEmail({
  to,
  type = 'intake',
  ticketId,
  customerName,
  ticket,
  filename,
}) {
  const accessToken = await getValidAccessToken();

  if (!ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  const response = await fetch('/api/send-ticket-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: to.trim(),
      type,
      ticketId,
      customerName,
      filename,
      ticket,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();
  let data = {};
  if (contentType.includes('application/json')) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  } else if (raw.trimStart().startsWith('<!')) {
    throw new Error(
      'Email API nije dostupan na serveru. Na Hostingeru mora biti Node.js aplikacija (npm start), ne statički hosting.'
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `Email nije poslat (${response.status}).`);
  }
  if (!data.ok) {
    throw new Error(data.error || 'Email API nije vratio potvrdu slanja.');
  }
  return data;
}

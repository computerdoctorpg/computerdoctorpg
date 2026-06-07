import { supabase } from '@/lib/customSupabaseClient';

export async function sendTicketEmail({
  to,
  type = 'intake',
  ticketId,
  customerName,
  ticket,
  filename,
  pdfBase64,
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Morate biti ulogovani da biste poslali email.');
  }

  if (!ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  const response = await fetch('/api/send-ticket-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      to: to.trim(),
      type,
      ticketId,
      customerName,
      filename,
      ticket,
      ...(pdfBase64 ? { pdfBase64 } : {}),
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

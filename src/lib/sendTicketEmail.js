import { supabase } from '@/lib/customSupabaseClient';

export async function sendTicketEmail({
  to,
  type = 'intake',
  ticketId,
  customerName,
  pdfBlob,
  filename,
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Morate biti ulogovani da biste poslali email.');
  }

  const pdfBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.split(',')[1];
      if (!base64) reject(new Error('Neuspješno kodiranje PDF-a.'));
      else resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

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
      pdfBase64,
      filename,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Email nije poslat.');
  }
  return data;
}

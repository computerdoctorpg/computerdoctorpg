import { supabase } from '@/lib/customSupabaseClient';
import { createClientBackup } from '@/lib/backup';

export async function runServerBackup() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('Sesija nije pronađena. Molimo prijavite se ponovo.');
  }

  const response = await fetch('/api/backup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Neuspešan serverski backup.');
  }

  const backup = await response.json();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || `computer-doctor-backup-${Date.now()}.json`;

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return backup;
}

export async function previewBackupCounts() {
  const backup = await createClientBackup({ source: 'preview' });
  return {
    counts: backup.counts,
    errors: backup.errors,
  };
}

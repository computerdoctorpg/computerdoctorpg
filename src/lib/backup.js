import { supabase } from '@/lib/customSupabaseClient';
import { BACKUP_TABLES, BACKUP_VERSION } from '@/lib/backupConstants';

const LOCAL_STORAGE_KEYS = [
  'pc_servis_deleted_ticket_ids',
  'pc_servis_recycle_bin_tickets',
];

export async function fetchAllRows(table) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await supabase
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

function collectLocalStorageBackup() {
  const localStorageData = {};

  LOCAL_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      localStorageData[key] = raw ? JSON.parse(raw) : null;
    } catch {
      localStorageData[key] = null;
    }
  });

  return localStorageData;
}

function buildCounts(database) {
  return Object.fromEntries(
    BACKUP_TABLES.map((table) => [table, database[table]?.length ?? 0])
  );
}

export async function createClientBackup({ createdBy = null, source = 'client' } = {}) {
  const database = {};
  const errors = [];

  for (const table of BACKUP_TABLES) {
    try {
      database[table] = await fetchAllRows(table);
    } catch (error) {
      console.warn(`Backup skip ${table}:`, error);
      database[table] = [];
      errors.push({ table, message: error.message });
    }
  }

  const localStorageData = collectLocalStorageBackup();

  return {
    meta: {
      version: BACKUP_VERSION,
      app: 'pc-servis-admin',
      createdAt: new Date().toISOString(),
      createdBy,
      source,
    },
    counts: {
      ...buildCounts(database),
      localRecycleBin: localStorageData.pc_servis_recycle_bin_tickets?.length ?? 0,
    },
    database,
    localStorage: localStorageData,
    errors: errors.length ? errors : undefined,
  };
}

export function formatBackupFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
  return `computer-doctor-backup-${stamp}.json`;
}

export function downloadBackupJson(backup, filename) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || formatBackupFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function runClientBackup({ createdBy } = {}) {
  const backup = await createClientBackup({ createdBy, source: 'client' });
  downloadBackupJson(backup);
  return backup;
}

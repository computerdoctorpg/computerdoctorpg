import fs from 'node:fs';
import path from 'node:path';

export const TABLES_IN_ORDER = [
  'parts_categories',
  'parts',
  'clients',
  'tickets',
  'parts_sales',
  'parts_sales_new',
  'users',
];

export const BACKUP_DIR = path.resolve(process.cwd(), 'data');
export const BACKUP_FILE = path.join(BACKUP_DIR, 'export-backup.json');

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file.');
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const read = (key) => raw.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();
  return {
    VITE_SUPABASE_URL: read('VITE_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: read('VITE_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: read('SUPABASE_SERVICE_ROLE_KEY'),
    OLD_SUPABASE_URL: read('OLD_SUPABASE_URL'),
    OLD_SUPABASE_ANON_KEY: read('OLD_SUPABASE_ANON_KEY'),
    OLD_SUPABASE_SERVICE_ROLE_KEY: read('OLD_SUPABASE_SERVICE_ROLE_KEY'),
    OLD_EXPORT_EMAIL: read('OLD_EXPORT_EMAIL'),
    OLD_EXPORT_PASSWORD: read('OLD_EXPORT_PASSWORD'),
    NEW_SUPABASE_URL: read('NEW_SUPABASE_URL'),
    ADMIN_EMAIL: read('ADMIN_EMAIL'),
    ADMIN_PASSWORD: read('ADMIN_PASSWORD'),
  };
}

export async function fetchAllRows(client, table) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

export async function upsertRows(client, table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    inserted += batch.length;
  }

  console.log(`  ${table}: ${inserted} rows`);
  return inserted;
}

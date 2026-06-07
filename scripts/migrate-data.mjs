/**
 * Migrate data from old Supabase (Horizon) to new Supabase project.
 *
 * Option A - service role (best):
 *   OLD_SUPABASE_URL=https://wogcdrvkthkjaatwzknv.supabase.co
 *   OLD_SUPABASE_SERVICE_ROLE_KEY=old-service-role-key
 *   VITE_SUPABASE_URL=https://new-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=new-service-role-key
 *
 * Option B - login to old DB (if you know email/password from live site):
 *   OLD_EXPORT_EMAIL=prodaja@computer-doctor.me
 *   OLD_EXPORT_PASSWORD=your-password
 *
 * Run: npm run migrate-data
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env file.');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const readEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();

const oldUrl = readEnv('OLD_SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const oldServiceKey = readEnv('OLD_SUPABASE_SERVICE_ROLE_KEY');
const oldEmail = readEnv('OLD_EXPORT_EMAIL');
const oldPassword = readEnv('OLD_EXPORT_PASSWORD');

const newUrl = readEnv('NEW_SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
const newServiceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

const TABLES_IN_ORDER = [
  'parts_categories',
  'parts',
  'clients',
  'tickets',
  'parts_sales',
  'parts_sales_new',
  'users',
];

const BACKUP_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_FILE = path.join(BACKUP_DIR, 'export-backup.json');

async function createOldClient() {
  if (oldServiceKey) {
    console.log('Old DB: using service_role key');
    return createClient(oldUrl, oldServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  if (oldEmail && oldPassword) {
    console.log('Old DB: using email/password login');
    const client = createClient(oldUrl, readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('OLD_SUPABASE_ANON_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client.auth.signInWithPassword({
      email: oldEmail,
      password: oldPassword,
    });

    if (error) {
      console.error('Old DB login failed:', error.message);
      console.error('Check OLD_EXPORT_EMAIL and OLD_EXPORT_PASSWORD in .env');
      process.exit(1);
    }

    console.log(`Logged in to old DB as ${oldEmail}`);
    return client;
  }

  console.error(`
Cannot read old database. Add ONE of these to .env:

  OLD_SUPABASE_SERVICE_ROLE_KEY=...   (from old Supabase / Hostinger Horizon)

OR

  OLD_EXPORT_EMAIL=prodaja@computer-doctor.me
  OLD_EXPORT_PASSWORD=your-live-site-password
`);
  process.exit(1);
}

async function fetchAllRows(client, table) {
  const pageSize = 1000;
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    if (!data?.length) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function upsertRows(client, table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  const batchSize = 200;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: 'id' });
    if (error) {
      throw new Error(`${table} insert: ${error.message}`);
    }
    inserted += batch.length;
  }

  console.log(`  ${table}: ${inserted} rows`);
  return inserted;
}

if (!newUrl || !newServiceKey) {
  console.error('Add NEW database credentials to .env:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

if (oldUrl === newUrl && !readEnv('NEW_SUPABASE_URL')) {
  console.warn('Warning: old and new URL are the same. Set NEW_SUPABASE_URL for the new project.');
}

console.log('=== PC Servis - migracija podataka ===\n');
console.log(`Stara baza: ${oldUrl}`);
console.log(`Nova baza:  ${newUrl}\n`);

const oldClient = await createOldClient();
const newClient = createClient(newUrl, newServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const exportData = {};
const summary = {};

console.log('1) Export iz stare baze...');
for (const table of TABLES_IN_ORDER) {
  try {
    exportData[table] = await fetchAllRows(oldClient, table);
    console.log(`  ${table}: ${exportData[table].length} rows`);
    summary[table] = exportData[table].length;
  } catch (error) {
    console.warn(`  ${table}: SKIP (${error.message})`);
    exportData[table] = [];
    summary[table] = 0;
  }
}

if (!exportData.tickets?.length && !exportData.clients?.length) {
  console.error('\nNema podataka za migraciju.');
  console.error('Stara baza je prazna ILI nemaš pristup (pogrešan ključ/lozinka).');
  process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.writeFileSync(BACKUP_FILE, JSON.stringify(exportData, null, 2));
console.log(`\nBackup sačuvan: ${BACKUP_FILE}`);

console.log('\n2) Import u novu bazu...');
let totalImported = 0;
for (const table of TABLES_IN_ORDER) {
  try {
    totalImported += await upsertRows(newClient, table, exportData[table]);
  } catch (error) {
    console.error(`  ${table}: FAILED - ${error.message}`);
  }
}

console.log('\n=== Migracija završena ===');
console.log(`Tiketi:   ${summary.tickets ?? 0}`);
console.log(`Klijenti: ${summary.clients ?? 0}`);
console.log(`Dijelovi: ${summary.parts ?? 0}`);
console.log(`Ukupno uvezeno: ${totalImported} redova`);
console.log('\nSljedeći korak: npm run dev i provjeri podatke u aplikaciji.');

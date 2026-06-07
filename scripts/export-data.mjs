/**
 * Export all data from Supabase (old Horizon DB) to data/export-backup.json
 *
 * Add to .env:
 *   OLD_EXPORT_EMAIL=prodaja@computer-doctor.me
 *   OLD_EXPORT_PASSWORD=your-password
 *
 * Run: npm run export-data
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, TABLES_IN_ORDER, fetchAllRows, BACKUP_FILE, BACKUP_DIR } from './lib/migrate-utils.mjs';

const env = loadEnv();

const url = env.OLD_SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.OLD_SUPABASE_ANON_KEY;
const email = env.OLD_EXPORT_EMAIL;
const password = env.OLD_EXPORT_PASSWORD;
const serviceKey = env.OLD_SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('Missing VITE_SUPABASE_URL or OLD_SUPABASE_URL in .env');
  process.exit(1);
}

let client;

if (serviceKey) {
  console.log('Connecting with service_role key...');
  client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else if (email && password) {
  console.log(`Logging in as ${email}...`);
  client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }
} else {
  console.error('Add OLD_EXPORT_EMAIL + OLD_EXPORT_PASSWORD or OLD_SUPABASE_SERVICE_ROLE_KEY to .env');
  process.exit(1);
}

console.log('\nExporting data...\n');
const exportData = {};

for (const table of TABLES_IN_ORDER) {
  try {
    exportData[table] = await fetchAllRows(client, table);
    console.log(`  ${table}: ${exportData[table].length} rows`);
  } catch (error) {
    console.warn(`  ${table}: SKIP (${error.message})`);
    exportData[table] = [];
  }
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.writeFileSync(BACKUP_FILE, JSON.stringify(exportData, null, 2));

console.log(`\nBackup saved: ${BACKUP_FILE}`);
console.log(`Tiketi: ${exportData.tickets?.length ?? 0}, Klijenti: ${exportData.clients?.length ?? 0}`);

if (!exportData.tickets?.length && !exportData.clients?.length) {
  console.warn('\nNo ticket/client data exported. Check login credentials.');
  process.exit(1);
}

console.log('\nNext: npm run import-data (after new Supabase is ready)');

/**
 * Import data/export-backup.json into NEW Supabase project.
 *
 * Prerequisites:
 * 1. Run supabase/schema.sql in new project SQL Editor
 * 2. Add to .env:
 *    VITE_SUPABASE_URL=https://NEW-PROJECT.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=new-service-role-key
 *
 * Run: npm run import-data
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import {
  loadEnv,
  TABLES_IN_ORDER,
  BACKUP_FILE,
  upsertRows,
} from './lib/migrate-utils.mjs';

const env = loadEnv();
const url = env.NEW_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (new Supabase project)');
  process.exit(1);
}

if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`Missing ${BACKUP_FILE}. Run: npm run export-data`);
  process.exit(1);
}

const exportData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('=== Import u novu Supabase bazu ===\n');
console.log(`Target: ${url}\n`);

let total = 0;
for (const table of TABLES_IN_ORDER) {
  try {
    total += await upsertRows(admin, table, exportData[table] || []);
  } catch (error) {
    console.error(`  ${table}: FAILED - ${error.message}`);
  }
}

// Create auth users for public.users rows (except those already in auth)
const users = exportData.users || [];
if (users.length) {
  console.log('\nAuth users...');
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set(authList?.users?.map((u) => u.email?.toLowerCase()) || []);

  for (const u of users) {
    if (!u.email || existingEmails.has(u.email.toLowerCase())) continue;
    const tempPassword = `Temp${Math.random().toString(36).slice(2)}!A1`;
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { migrated: true },
    });
    if (error) {
      console.warn(`  ${u.email}: ${error.message}`);
    } else {
      await admin.from('users').upsert({ id: data.user.id, email: u.email, role: u.role || 'operater' }, { onConflict: 'id' });
      console.log(`  Created auth user: ${u.email} (temp password — use reset)`);
    }
  }
}

console.log(`\n=== Import done: ${total} rows ===`);
console.log('\nUpdate Hostinger env vars with NEW VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then Redeploy.');
console.log('Run: npm run reset-password -- email@example.com YourPassword');

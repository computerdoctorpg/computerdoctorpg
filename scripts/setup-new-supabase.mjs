/**
 * Kompletan setup nove Supabase baze:
 * 1. schema.sql
 * 2. admin nalog
 * 3. export + import podataka (ako je OLD_EXPORT_PASSWORD u .env)
 *
 * Run: npm run setup-supabase
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadEnv } from './lib/migrate-utils.mjs';

const env = loadEnv();
const root = process.cwd();

function run(label, script, args = []) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    stdio: 'inherit',
    cwd: root,
  });
  if (result.status !== 0) {
    console.error(`\n${label} nije uspio.`);
    process.exit(result.status || 1);
  }
}

const adminEmail = env.OLD_EXPORT_EMAIL || 'prodaja@computer-doctor.me';
const adminPassword = env.ADMIN_PASSWORD || 'Servis2026!';

if (!env.SUPABASE_DB_PASSWORD) {
  console.log('\n=== SCHEMA (jedan korak u Supabase) ===\n');
  console.log('Supabase → SQL Editor → zalijepi cijeli fajl supabase/schema.sql → Run');
  console.log('Authentication → Providers → Email → isključi Confirm email\n');
  console.log('ILI dodaj SUPABASE_DB_PASSWORD u .env pa ponovo: npm run setup-supabase\n');
  run('Admin nalog', 'reset-admin-password.mjs', [adminEmail, adminPassword]);
} else {
  run('Schema', 'apply-schema.mjs');
  run('Admin nalog', 'reset-admin-password.mjs', [adminEmail, adminPassword]);
}

if (env.OLD_EXPORT_PASSWORD && env.OLD_SUPABASE_URL) {
  run('Export sa stare baze', 'export-data.mjs');
  run('Import u novu bazu', 'import-data.mjs');
  run('Admin lozinka (finalno)', 'reset-admin-password.mjs', [adminEmail, adminPassword]);
} else {
  console.log('\n=== Migracija preskočena ===');
  console.log('Za prebacivanje tiketa dodaj OLD_EXPORT_PASSWORD u .env pa ponovo: npm run setup-supabase');
}

console.log('\n=== GOTOVO ===');
console.log(`Login: ${adminEmail}`);
console.log(`Lozinka: ${adminPassword}`);
console.log('\nHostinger → Environment variables → ažuriraj 3 Supabase ključa → Redeploy');

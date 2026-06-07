/**
 * Provjeri da li je Supabase soft-delete (deleted_at) aktivan.
 * Ako nije — ispiši SQL koji vlasnik projekta treba pokrenuti.
 *
 * Run: npm run setup-korpa
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

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');
const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const adminEmail = readEnv('OLD_EXPORT_EMAIL') || 'prodaja@computer-doctor.me';
const adminPassword = readEnv('OLD_EXPORT_PASSWORD');

if (!supabaseUrl || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

let client;

if (serviceKey) {
  client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else if (adminPassword) {
  client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (error) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }
} else {
  client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const { error } = await client.from('tickets').select('deleted_at').limit(1);

if (!error) {
  console.log('OK: Kolona deleted_at postoji — korpa radi direktno iz Supabase baze.');
  console.log('Obrisani nalozi su vidljivi na svim uređajima.');
  process.exit(0);
}

const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/add-soft-delete.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('\nKolona deleted_at JOŠ NE POSTOJI u Supabase bazi.\n');
console.log('=== OPCIJA A (preporučeno) ===');
console.log('Vlasnik Supabase projekta neka otvori:');
console.log('  Supabase Dashboard → SQL Editor → New query');
console.log('i pokrene:\n');
console.log(sql);
console.log('\n=== OPCIJA B (radi odmah bez SQL-a) ===');
console.log('Korpa preko servera već radi ako pokrenete aplikaciju sa:');
console.log('  npm start');
console.log('(ne samo npm run dev na vite-u bez server API-ja — vite dev sada takođe ima /api/recycle-bin)\n');
console.log('Obrisani nalozi se čuvaju u data/recycle-bin.json na serveru.\n');

process.exit(1);

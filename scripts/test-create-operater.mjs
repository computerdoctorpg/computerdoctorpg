/**
 * Test kreiranja operatera — SAMO preko admin API (ne šalje email).
 * Zahtijeva SUPABASE_SERVICE_ROLE_KEY u .env.
 *
 * Usage: node scripts/test-create-operater.mjs [operaterName] [operaterPassword]
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
const env = fs.readFileSync(envPath, 'utf8');
const read = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^"|"$/g, '');

const url = read('VITE_SUPABASE_URL');
const serviceKey = read('SUPABASE_SERVICE_ROLE_KEY');
const operaterName = process.argv[2] || 'Marko';
const operaterPass = process.argv[3] || 'Operater123';

if (!serviceKey) {
  console.error('GREŠKA: SUPABASE_SERVICE_ROLE_KEY nije u .env');
  console.error('Ne koristite signUp za test — šalje email na lažne adrese i Supabase blokira projekat.');
  process.exit(1);
}

const slug = operaterName
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, '.')
  .replace(/[^a-z0-9._-]/g, '')
  .replace(/\.+/g, '.')
  .replace(/^\.+|\.+$/g, '');
const email = `operater.${slug}@computerdoctor.in`;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Kreiranje operatera preko admin API (bez emaila):', email);

const { data, error } = await admin.auth.admin.createUser({
  email,
  password: operaterPass,
  email_confirm: true,
  user_metadata: { display_name: operaterName, role: 'operater' },
});

if (error) {
  console.error('FAIL:', error.message);
  process.exit(1);
}

console.log('OK id=', data.user.id);
console.log('Prijava: ime', operaterName, '+ lozinka');

await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
console.log('Test korisnik obrisan.');

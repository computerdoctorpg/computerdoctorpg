/**
 * Primijeni schema preko Supabase Management API.
 * Jednokratno: https://supabase.com/dashboard/account/tokens → Generate token
 * Dodaj u .env: SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Run: npm run apply-schema-api
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './lib/migrate-utils.mjs';

const env = loadEnv();
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.VITE_SUPABASE_URL;

if (!token || !url) {
  console.error('Dodaj u .env: SUPABASE_ACCESS_TOKEN=sbp_...');
  console.error('Token: supabase.com/dashboard/account/tokens → Generate new token');
  process.exit(1);
}

const projectRef = url.replace('https://', '').replace('.supabase.co', '').trim();
const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/schema.sql'), 'utf8');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const body = await response.text();
if (!response.ok) {
  console.error('Schema FAIL:', response.status, body);
  process.exit(1);
}

console.log('Schema OK — tabele kreirane automatski.');

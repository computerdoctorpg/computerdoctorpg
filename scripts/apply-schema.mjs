/**
 * Primijeni supabase/schema.sql na novu bazu.
 * Zahtijeva SUPABASE_DB_PASSWORD (lozinka baze pri kreiranju projekta).
 *
 * Supabase → Project Settings → Database → Database password
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { loadEnv } from './lib/migrate-utils.mjs';

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const dbPassword = env.SUPABASE_DB_PASSWORD;

if (!url || !dbPassword) {
  console.error('Dodaj u .env:');
  console.error('  SUPABASE_DB_PASSWORD=lozinka-koju-si-postavio-pri-kreiranju-projekta');
  console.error('(Supabase → Project Settings → Database)');
  process.exit(1);
}

const projectRef = url.replace('https://', '').replace('.supabase.co', '').trim();
const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

const hosts = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
];

let connected = false;
let lastError;

for (const connectionString of hosts) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Povezivanje na bazu...');
    await client.connect();
    console.log('Primjenjujem schema.sql...');
    await client.query(sql);
    await client.end();
    connected = true;
    console.log('Schema OK — tabele, RLS i triggeri kreirani.');
    break;
  } catch (error) {
    lastError = error;
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

if (!connected) {
  console.error('Schema FAIL:', lastError?.message || 'Nepoznata greška');
  process.exit(1);
}

/**
 * Ispiši varijable za Hostinger Node.js → Environment variables
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './lib/migrate-utils.mjs';

const env = loadEnv();
const raw = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
const read = (key) => raw.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();

console.log('=== Kopiraj u Hostinger → Node.js → Environment variables ===\n');
console.log(`VITE_SUPABASE_URL=${env.VITE_SUPABASE_URL}`);
console.log(`VITE_SUPABASE_ANON_KEY=${env.VITE_SUPABASE_ANON_KEY}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`SMTP_HOST=${read('SMTP_HOST') || 'smtp.hostinger.com'}`);
console.log(`SMTP_PORT=${read('SMTP_PORT') || '465'}`);
console.log(`SMTP_SECURE=${read('SMTP_SECURE') || 'true'}`);
console.log(`SMTP_USER=${read('SMTP_USER') || 'servis@computerdoctor.in'}`);
console.log(`SMTP_PASS=${read('SMTP_PASS') || '"Servis1243#"'} `);
console.log(`SMTP_FROM=${read('SMTP_FROM') || 'servis@computerdoctor.in'}`);
console.log(`SMTP_FROM_NAME=${read('SMTP_FROM_NAME') || 'Computer Doctor'}`);
console.log('\nZatim: Redeploy');

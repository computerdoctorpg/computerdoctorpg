/**
 * Generiše hostinger.env za import u Hostinger panel.
 * Run: npm run hostinger-env
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './lib/migrate-utils.mjs';

const env = loadEnv();
const root = process.cwd();
const raw = fs.readFileSync(path.join(root, '.env'), 'utf8');
const read = (key) => raw.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();

const lines = [
  '# Hostinger Node.js → Environment variables → Import .env',
  '',
  `VITE_SUPABASE_URL=${env.VITE_SUPABASE_URL}`,
  `VITE_SUPABASE_ANON_KEY=${env.VITE_SUPABASE_ANON_KEY}`,
  `SUPABASE_URL=${env.VITE_SUPABASE_URL}`,
  `SUPABASE_ANON_KEY=${env.VITE_SUPABASE_ANON_KEY}`,
  `SUPABASE_SERVICE_ROLE_KEY=${env.SUPABASE_SERVICE_ROLE_KEY}`,
  '',
  `SMTP_HOST=${read('SMTP_HOST') || 'smtp.hostinger.com'}`,
  `SMTP_PORT=${read('SMTP_PORT') || '465'}`,
  `SMTP_SECURE=${read('SMTP_SECURE') || 'true'}`,
  `SMTP_USER=${read('SMTP_USER') || 'servis@computerdoctor.in'}`,
  `SMTP_PASS=${read('SMTP_PASS') || 'Servis1243#'}`,
  `SMTP_FROM=${read('SMTP_FROM') || 'servis@computerdoctor.in'}`,
  `SMTP_FROM_NAME=${read('SMTP_FROM_NAME') || 'Computer Doctor'}`,
  '',
  `APP_LOGIN_URL=${read('APP_LOGIN_URL') || 'https://www.computerdoctor.in'}`,
  '',
].join('\n');

const outPath = path.join(root, 'hostinger.env');
fs.writeFileSync(outPath, lines, 'utf8');

console.log('=== hostinger.env kreiran ===\n');
console.log(lines);
console.log(`\nFajl: ${outPath}`);
console.log('Hostinger → Node.js → Environment variables → Import .env → odaberi hostinger.env');
console.log('Zatim: Redeploy');

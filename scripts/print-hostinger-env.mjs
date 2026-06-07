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
const read = (key) => {
  let value = raw.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();
  if (!value) return value;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
};

const smtpPass = read('SMTP_PASS') || '';
const smtpPassB64 = read('SMTP_PASS_B64') || (smtpPass ? Buffer.from(smtpPass, 'utf8').toString('base64') : '');

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
  `SMTP_PASS_B64=${smtpPassB64}`,
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
console.log('\nHostinger → Node.js → Environment variables:');
console.log('1. Obriši staru varijablu SMTP_PASS (ako postoji)');
console.log('2. Import .env → odaberi hostinger.env  ILI  Add: SMTP_PASS_B64=' + smtpPassB64);
console.log('3. Redeploy');

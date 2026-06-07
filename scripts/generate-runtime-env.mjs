/**
 * Generiše dist/env.js za produkciju (Hostinger build).
 * Čita env varijable u trenutku builda i upisuje window.__ENV__ u JS fajl.
 */
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

const distDir = path.resolve(process.cwd(), 'dist');
const outFile = path.join(distDir, 'env.js');

const runtimeEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
};

if (!fs.existsSync(distDir)) {
  console.error('dist/ folder not found. Run vite build first.');
  process.exit(1);
}

fs.writeFileSync(outFile, `window.__ENV__=${JSON.stringify(runtimeEnv)};\n`, 'utf8');

if (!runtimeEnv.VITE_SUPABASE_URL || !runtimeEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn('WARNING: Supabase env vars missing during build — env.js will be empty.');
  console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Hostinger before deploy.');
} else {
  console.log('Generated dist/env.js with Supabase config.');
}

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSendTicketEmail } from './server/emailApi.mjs';
import { handleAdminUsers } from './server/adminUsersApi.mjs';
import { handleBackup } from './server/backupApi.mjs';
import { handleRecycleBin } from './server/recycleBinApi.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function loadDotEnv() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
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

loadDotEnv();

const distDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

const runtimeEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
};

const envScript = `<script>window.__ENV__=${JSON.stringify(runtimeEnv)};</script>`;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isStaticAssetPath(urlPath) {
  return (
    urlPath.startsWith('/assets/')
    || urlPath.startsWith('/images/')
    || urlPath.startsWith('/fonts/')
    || /\.(js|mjs|css|png|jpe?g|gif|svg|ico|webp|woff2?|json|map|txt|xml|webmanifest)$/i.test(urlPath)
  );
}

function shouldServeSpaIndex(urlPath) {
  if (urlPath.startsWith('/api/')) return false;
  if (urlPath === '/env.js') return false;
  if (isStaticAssetPath(urlPath)) return false;
  return true;
}

function getCacheControl(urlPath, ext) {
  if (ext === '.html' || urlPath === '/') {
    return 'no-cache, no-store, must-revalidate';
  }
  if (urlPath.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  if (urlPath === '/env.js') {
    return 'no-cache, no-store, must-revalidate';
  }
  return undefined;
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath === '/api/send-ticket-email') {
    await handleSendTicketEmail(req, res);
    return;
  }

  if (urlPath === '/api/admin-users') {
    await handleAdminUsers(req, res);
    return;
  }

  if (urlPath === '/api/backup') {
    await handleBackup(req, res);
    return;
  }

  if (urlPath === '/api/recycle-bin' || urlPath === '/api/recycle-bin/ids') {
    await handleRecycleBin(req, res, urlPath);
    return;
  }

  if (urlPath === '/env.js' || urlPath === '/api/runtime-env') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(`window.__ENV__=${JSON.stringify(runtimeEnv)};`);
    return;
  }

  let filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);

  if (!existsSync(filePath)) {
    if (shouldServeSpaIndex(urlPath)) {
      filePath = join(distDir, 'index.html');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const cacheControl = getCacheControl(urlPath, ext);
  const headers = {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    ...(cacheControl ? { 'Cache-Control': cacheControl } : {}),
  };

  if (ext === '.html') {
    let html = readFileSync(filePath, 'utf8');
    if (!html.includes('window.__ENV__')) {
      html = html.replace('</head>', `${envScript}</head>`);
    }
    res.writeHead(200, headers);
    res.end(html);
    return;
  }

  res.writeHead(200, headers);
  res.end(readFileSync(filePath));
}).listen(port, '0.0.0.0', () => {
  console.log(`PC Servis Admin running on port ${port}`);
  if (!runtimeEnv.VITE_SUPABASE_URL || !runtimeEnv.VITE_SUPABASE_ANON_KEY) {
    console.warn('WARNING: Supabase env variables are missing. Set them in Hostinger and redeploy.');
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('WARNING: SMTP not configured. Email sending will not work until SMTP_* env vars are set.');
  }
});

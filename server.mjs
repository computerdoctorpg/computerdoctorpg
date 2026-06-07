import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

const runtimeEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
};

const envScript = `<script>window.__ENV__=${JSON.stringify(runtimeEnv)};</script>`;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
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

createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(distDir, urlPath === '/' ? 'index.html' : urlPath);

  if (!existsSync(filePath) || urlPath.endsWith('/')) {
    filePath = join(distDir, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);

  if (ext === '.html') {
    let html = readFileSync(filePath, 'utf8');
    if (!html.includes('window.__ENV__')) {
      html = html.replace('</head>', `${envScript}</head>`);
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
}).listen(port, '0.0.0.0', () => {
  console.log(`PC Servis Admin running on port ${port}`);
  if (!runtimeEnv.VITE_SUPABASE_URL || !runtimeEnv.VITE_SUPABASE_ANON_KEY) {
    console.warn('WARNING: Supabase env variables are missing. Set them in Hostinger and redeploy.');
  }
});

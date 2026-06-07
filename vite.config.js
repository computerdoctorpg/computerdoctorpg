import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { handleSendTicketEmail } from './server/emailApi.mjs';
import { handleAdminUsers } from './server/adminUsersApi.mjs';
import { handleBackup } from './server/backupApi.mjs';
import { handleRecycleBin } from './server/recycleBinApi.mjs';

const emailApiPlugin = (env) => ({
  name: 'email-api-dev',
  configureServer(server) {
    server.middlewares.use('/env.js', (_req, res) => {
      const runtimeEnv = {
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL || '',
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
      };
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.end(`window.__ENV__=${JSON.stringify(runtimeEnv)};`);
    });

    server.middlewares.use('/api/send-ticket-email', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
      process.env.SMTP_HOST = env.SMTP_HOST;
      process.env.SMTP_PORT = env.SMTP_PORT;
      process.env.SMTP_USER = env.SMTP_USER;
      process.env.SMTP_PASS = env.SMTP_PASS;
      process.env.SMTP_FROM = env.SMTP_FROM;
      process.env.SMTP_FROM_NAME = env.SMTP_FROM_NAME;
      process.env.SMTP_SECURE = env.SMTP_SECURE;
      await handleSendTicketEmail(req, res);
    });

    server.middlewares.use('/api/admin-users', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
      await handleAdminUsers(req, res);
    });

    server.middlewares.use('/api/backup', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }
      process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
      await handleBackup(req, res);
    });

    server.middlewares.use(async (req, res, next) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath !== '/api/recycle-bin' && urlPath !== '/api/recycle-bin/ids') {
        next();
        return;
      }

      process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
      await handleRecycleBin(req, res, urlPath);
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), emailApiPlugin(env)],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/translate': {
          target: 'https://api.mymemory.translated.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/translate/, ''),
        },
      },
    },
    preview: {
      port: 3000,
      host: true,
    },
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  };
});

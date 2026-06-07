import { resetSupabaseClient } from '@/lib/customSupabaseClient';
import { isSupabaseConfigured } from '@/lib/getSupabaseConfig';

const ENV_ENDPOINTS = [`/api/runtime-env?t=${Date.now()}`, `/env.js?t=${Date.now()}`];

export async function loadRuntimeEnv() {
  if (typeof window === 'undefined') return;

  delete window.__ENV__;

  for (const src of ENV_ENDPOINTS) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });

    if (isSupabaseConfigured()) break;
  }

  resetSupabaseClient();
}

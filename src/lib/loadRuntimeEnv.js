import { resetSupabaseClient } from '@/lib/customSupabaseClient';
import { isSupabaseConfigured } from '@/lib/getSupabaseConfig';

export async function loadRuntimeEnv() {
  if (typeof window === 'undefined') return;
  if (isSupabaseConfigured()) return;

  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `/env.js?t=${Date.now()}`;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  resetSupabaseClient();
}

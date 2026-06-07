import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/getSupabaseConfig';

let clientInstance = null;

export const getSupabaseClient = () => {
  if (clientInstance) return clientInstance;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};

const clientProxy = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient();
      if (!client) {
        if (prop === 'then') return undefined;
        throw new Error('Supabase nije podešen. Provjerite env varijable na Hostingeru.');
      }
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export default clientProxy;

export {
  clientProxy as supabase,
  isSupabaseConfigured,
};

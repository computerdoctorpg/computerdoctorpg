import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/lib/getSupabaseConfig';

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Hostinger environment variables.'
  );
}

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default customSupabaseClient;

export {
  customSupabaseClient,
  customSupabaseClient as supabase,
};
